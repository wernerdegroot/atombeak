[![Build Status](https://travis-ci.org/wernerdegroot/atombeak.svg?branch=master)](https://travis-ci.org/wernerdegroot/atombeak)

# atombeak
Create asynchronous atomic functions!

The library has been written with Redux in mind (but can be used without it just fine).

## Beautiful concurrency

*What follows is adapted from [Simon Peyton Jones' "Beautiful concurrency"](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/beautiful.pdf) which I warmly reccomend.*

### A simple example: bank accounts

Here is a simple programming task.

*Transfer money from one bank account to another. Both accounts are stored in the Redux store.*

This example is somewhat unrealistic, but its simplicity allows us to focus on what is new: transactional memory.

Let's start with the following store state:

```typescript
export type StoreState = Readonly<{
  bankAccounts: BankAccount[]
}>
```

where

```typescript
type BankAccount = Readonly<{
  accountNumber: string
  balance: number
}>
```

To update the bank accounts, we create the following action:

```typescript
type UpdateBankAccount = Readonly<{
  type: 'UPDATE_BANK_ACCOUNT'
  accountNumber: string
  balance: number
}>

function updateBankAccount(accountNumber: string, balance: number): UpdateBankAccount {
  return {
    type: 'UPDATE_BANK_ACCOUNT',
    accountNumber,
    balance 
  }
}
```

The reducer for `bankAccounts` looks like this:

```typescript
function bankAccountsReducer(bankAccounts: BankAccount[] = [], action: Action): BankAccount[] {
  switch (action.type) {
    case 'UPDATE_BANK_ACCOUNT':
      return bankAccounts.map(bankAccount => {
        if (bankAccount.accountNumber === action.accountNumber) {
          return {
            ...bankAccount,
            balance: action.balance
          }
        } else {
          return bankAccount
        }
      })
    default:
      return bankAccounts
  }
}
```

Here is how we might write the code for transfer (which is a [thunk](https://github.com/reduxjs/redux-thunk)):

```typescript
// Helper function to get balance from a given bank account:
function getBalanceFrom(storeState: StoreState, accountNumber: string) {
  return storeState
    .bankAccounts
    .find(bankAccount => bankAccount.accountNumber === accountNumber)
    .balance
}

const transfer = (fromAccountNumber: string, toAccountNumber: string, amount: number) => (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
  const state = getState()
  const fromBalance = getBalanceFrom(state, fromAccountNumber)
  const toBalance = getBalanceFrom(state, toAccountNumber)
  dispatch(updateBankAccount(fromAccountNumber, fromBalance - amount))
  dispatch(updateBankAccount(toAccountNumber, toBalance + amount))
}
```

Let's assume (for illustrative purposes) that we need to wait a while between withdrawing and depositing:

```typescript
const transfer = (fromAccountNumber: string, toAccountNumber: string, amount: number) => (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
  const state = getState()
  const fromBalance = getBalanceFrom(state, fromAccountNumber)
  const toBalance = getBalanceFrom(state, toAccountNumber)
  dispatch(updateBankAccount(fromAccountNumber, fromBalance - amount))
  setTimeout(() => {
    dispatch(updateBankAccount(toAccountNumber, toBalance + amount))
  }, 5000)
}
```

This code has a couple of flaws. Someone could observe an intermediate `StoreState` in which money left account `fromAccountNumber` but has not arrived in `toAccountNumber` yet. What's worse, the `toBalance` might have changed while waiting to dispatch an update to `toAccountNumber`. In a finance program, that might be unacceptable. How do we fix it?

### Software transactional memory

Software transactional memory is a promising approach to the challenge of
concurrency, as I will explain in this section. 

We'll define a *transactional variable* `TVar` which contains knowledge about the balance of a given bank account and knows how to update that balance:

```typescript
function balanceVar(accountNumber: string): {
  return new TVar<StoreState, number, Action>(
    // Get balance from `BankAccount`:
    storeState => getBalanceFrom(storeState, accountNumber), 

    // Id of the `TVar`, must be unique:
    'balance-of-' + accountNumber, 

    // `Action` to dispatch to change balance:
    (balance: number) => updateBankAccount(accountNumber, balance)
}
```

Given such a `TVar`, we're going to define `withdraw` as an `Operation<StoreState, number, Action>`, where the second type parameter (`number`) indicates the result of the operation:

```typescript
function withdraw(balanceVar: TVar<StoreState, number, Action>, amount: number): Operation<StoreState, number, Action> {
  return balanceVar
    .read()
    .flatMap(balance => {
      return balanceVar.write(balance - amount)
    })
}
```

The `deposit` operation is easily defined as:

```typescript
function deposit(balanceVar: TVar<StoreState, number, Action>, amount: number): Operation<StoreState, number, Action> {
  return withdraw(balanceVar, -amount)
}
```

In case you are wondering what this `flatMap` is all about, I recommend [reading up](https://mostly-adequate.gitbooks.io/mostly-adequate-guide) on monads a little bit.

We can build big operations by combining smaller ones. We can combine `withdraw` and `deposit` to arrive at the following definition of `transfer`:

```typescript
function transfer(
  fromBalanceVar: TVar<StoreState, number, Action>,
  toBalanceVar: TVar<StoreState, number, Action>,
  amount: number): Operation<StoreState, number, Action> {
  return withdraw(fromBalanceVar, amount)
    .flatMap(() => Operation.timeout(5000))
    .flatMap(() => deposit(toBalanceVar, amount))
}
```

The middleware provided by this library let's you dispatch such an `Operation`. It makes two guarantees:

* **Atomicity:** the effects of the operation become visible all at once. This ensures that no intermediate states can be observed (a state in which money has been withdrawn from one account bus hasn't been deposited in the other account yet).

* **Isolation:** while executing an operation, the operation is completely unaffected by changes to the store state. It is as if the operation takes a snapshot of the world when it begins running, and then executes against that snapshot.

### Implementing software transactional memory

The guarantees of atomicity and isolation that I described earlier should be all that a programmer needs in order to use this library. Even so, I often find it helpful to have a reasonable implementation model to guide my intuitions, and I will sketch the implementation in this section. 

One particularly attractive way to implement transactions is well established in the database world, namely *optimistic execution*. When an operation is performed, a transaction log is created. While performing the operation, each call to `write` writes the id of the `TVar` and its new value into the log; it does not write to the `StoreState` itself. Each call to `read` first searches the log (in case the `TVar` was written by an earlier call to `write`); if no such record is found, the value is read from the `StoreState` itself, and the `TVar` and value read are recorded in the log. In the meantime, other `Action`s may be dispatched, reading and writing from the store state like crazy. 

When the operation is finished, the implementation first validates the log and, if validation is successful, commits the log. The validation step examines each `read` recorded in the log, and checks that the value in the log matches the value currently in the real store state. If so, validation succeeds, and the commit step takes all the writes recorded in the log and writes them to the store state by dispatching all the associated actions. 

What if validation fails? Then the transaction has had an inconsistent view of the store state. So we abort the transaction, re-initialise the log, and run the operation all over again. This process is called re-execution. Since none of the operations `write`s have been committed to the store state, it is perfectly safe to run it again. However, notice that it is crucial that the operation contains no code that may not be repeated. Fetching from a web server may or may not be acceptable.

### Blocking and choice

Atomic operations as we have introduced them so far are utterly inadequate to coordinate concurrent programs. They lack a key facility: blocking. In this section I’ll describe how the basic description of software transactional memory is elaborated to include them in a fully-modular way.

Suppose that a operation should block if it attempts to overdraw an account (i.e. withdraw more than the current balance). We achieve this in this library by adding the single operation `RetryOperation`. Here is a modified version of withdraw that blocks if the balance would go negative:

```typescript
function limitedWithdraw(balanceVar: TVar<StoreState, number, Action>, amount: number): Operation<StoreState, number, Action> {
  return balanceVar
    .read()
    .flatMap(balance => {
      if (amount > 0 && amount > balance) {
        return Operation.retry<StoreState, number, Action>()
      } else {
        return balanceVar.write(balance - amount)
      }
    })
}
```

The semantics of `Operation.retry()` are simple: if a retry action is performed, the current transaction is abandoned and retried at some later time. It would be correct to retry the transaction immediately, but it would also be inefficient: the state of the account will probably be unchanged, so the transaction will again hit the retry. This library will instead wait until some other piece of code writes to to the balance of the given account. How does the implementation know to wait on the balance of that particular account? Because the transaction read `balanceVar` on the way to the retry, and that fact is conveniently recorded in the transaction log.

### Example: dining philosophers

A fully annoted implementation of the dining philosophers problem is included in the `Examples` folder.
