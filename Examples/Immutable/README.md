# Dining philosophers with atombeak

## How to run
```
npm install
npm run webpack
```

open `index.html` in the root of this project.

Don't worry if you don't see things happening immediately. It will take 8 seconds for the first philosophers to finish picking up their forks.

## What the dining philosophers problem is

From Wikipedia:

> Five silent philosophers sit at a round table with bowls of spaghetti. Forks are placed between each pair of adjacent philosophers.
> 
> Each philosopher must alternately think and eat. However, a philosopher can only eat spaghetti when they have both left and right forks. Each fork can be held by only one philosopher and so a philosopher can use the fork only if it is not being used by another philosopher. After an individual philosopher finishes eating, they need to put down both forks so that the forks become available to others. A philosopher can take the fork on their right or the one on their left as they become available, but cannot start eating before getting both forks.
> 
> Eating is not limited by the remaining amounts of spaghetti or stomach space; an infinite supply and an infinite demand are assumed.

## How software transactional memory solves this

Each philosopher will start to pick up the left fork. As their transactions started when no fork was taken (the start of the dinner), they all will succeed in this (or think they did!) The same applies to picking up the right fork. An interesting thing happens when the first philosopher (philosopher 0, taking fork 0 and fork 1) will commit its transaction. At that point, philosopher 1 (taking fork 1 and fork 2) and philosopher 4 (taking fork 4 and fork 0) will not be able to commit their transaction anymore. What happend to the store state is inconsistent with their transaction! They will both restart their entire transaction. Next in line is philosopher 2 (taking fork 2 and fork 3), who is able to commit its transaction. This will make philosopher 3's transaction restart.