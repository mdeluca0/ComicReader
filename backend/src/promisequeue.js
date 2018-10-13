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
            var that = this;
            console.log('Started Processing: ' + item.id);
            return new Promise(item.func).then(function(){
                delete that.removeId(item.id);
                console.log('Finished Processing: ' + item.id);
            }).catch(function(err) {
                delete that.removeId(item.id);
                console.log('Finished Processing: ' + item.id);
                return err;
            });
        }
    }
    isEmpty() {
        return this.queue.length === 0;
    }
    removeId(id) {
        delete this.map[id];
    }
}

module.exports.PromiseQueue = PromiseQueue;
