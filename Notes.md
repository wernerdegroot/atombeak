* Start with state
* Read fork 1 -> No previous reads, grab from (last) state
* Write fork 1
* State fork 3 change -> Read of fork 1 didn't change
* Read fork 3 -> No previous reads, grab from last state
* Write fork 3

All OK!

* State fork 1 write -> Previous read, not OK!

Not OK!