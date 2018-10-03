class PriorityQueue {
    constructor() {
        this.queue = [];
    }
    enqueue(item, priority) {
        var qItem = {
            item: item,
            priority: priority
        };
        var contain = false;

        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i].priority > qItem.priority) {
                this.queue.splice(i, 0, qItem);
                contain = true;
                break;
            }
        }

        if (!contain) {
            this.queue.push(qItem);
        }
    }
    dequeue() {
        if (this.queue.length) {
            return this.queue.shift();
        }
    }
    isEmpty() {
        return this.queue.length === 0;
    }
}

module.exports.PriorityQueue = PriorityQueue;
