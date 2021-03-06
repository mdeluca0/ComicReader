class PromiseQueue {
    constructor() {
        this.queue = [];
        this.map = {};
    }
    enqueue(id, priority, func) {
        if (typeof(this.map[id]) !== 'undefined') {
            return;
        }

        this.map[id] = true;

        let qItem = {
            id: id,
            priority: priority,
            func: func
        };
        let contain = false;

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
            let item = this.queue.shift();
            let that = this;
            return new Promise(item.func).then(function(){
                delete that.removeId(item.id);
            }).catch(function(err) {
                delete that.removeId(item.id);
                console.log(err);
            });
        }
    }
    isEmpty() {
        return this.queue.length === 0;
    }
    count() {
        return this.queue.length;
    }
    removeId(id) {
        delete this.map[id];
    }
}

module.exports.PromiseQueue = PromiseQueue;
