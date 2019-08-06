import Request from './request';
import * as os from 'os';

export class RequestGroup<PageEngine> {
    private requests: Request<PageEngine>[];
    private completedUrls: string[];
    private requestedUrls: string[];
    private runQueue: boolean;
    private maxInstances: number;
    private runningRequests: number;
    private timerManager: number;
    private callbackRequestComplete: (request: Request<PageEngine>) => Promise<void>;

    /**
		Construct a request manager, the optional additional parameters provide a way to configure  internal mechanics to the request manager
	*/
    public constructor(maxQueueSize: number = 4, timerManager: number = 2500) {
        this.timerManager = timerManager;
        if (maxQueueSize === 0) {
            this.autoCalcQueueSize();
        } else {
            this.maxInstances = maxQueueSize;
        }

        this.runningRequests = 0;
        this.requestedUrls = [];
        this.completedUrls = [];
        this.requests = [];

        // this is just an empty dummy function
        this.callbackRequestComplete = (): Promise<void> => {
            return new Promise((resolve): void => {
                resolve();
            });
        };
    }

    /**
		Queue up a web request, by default web request CANNOT repeat unlexss the repeat parameter is set to true 
	*/
    public queue(webRequest: Request<PageEngine>, repeat: boolean = false): void {
        if (this.requestedUrls.includes(webRequest.getUrl()) === false || repeat === true) {
            this.requests.unshift(webRequest);
            this.requestedUrls.unshift(webRequest.getUrl());
        }
    }

    /**
     * Determine if this queue is running
     */
    public isRunning(): boolean {
        return this.runQueue;
    }

    /**
     * Populate the request queue with UP too what we are allowed to allocate to our workers
     */
    private populateRequestQueue(): void {
        let initRequests: Request<PageEngine>[] = [];
        if (this.requests.length > this.maxInstances) {
            // our current request queue is more then what we can handle at once, grab only what we can
            initRequests = this.requests.splice(0, this.maxInstances);
            this.runningRequests += initRequests.length;
        } else {
            // we have less then what we have for max instances, loop until we have max'd out what we can run
            while (this.requests.length > 0 && this.runningRequests < this.maxInstances) {
                if (typeof this.requests[0] !== 'undefined') {
                    initRequests.push(this.requests.shift() as Request<PageEngine>);
                    this.runningRequests++;
                }
            }
        }

        for (var i = 0; i < initRequests.length; i++) {
            let responsePromise = initRequests[i].run();
            responsePromise.then((resolveData: Request<PageEngine>): void => {
                this.callbackRequestComplete(resolveData).then((): void => {
                    resolveData.dispose().then((): void => {
                        this.completedUrls.push(resolveData.getUrl());
                        this.runningRequests--;
                    });
                });
            });
        }
    }

    /**
     * Stop the queue gracefully.
     * Note: This does not immediatly abort the queue, just won't allow it to fill back up at the next population interval
     */
    public stop(): void {
        this.runQueue = false;
    }

    public queueTimer(): Promise<void> {
        return new Promise((resolve): void => {
            // we have the ability to populate the request queue and we definitely have request ready to go
            if (this.runningRequests < this.maxInstances && this.requests.length > 0) {
                this.populateRequestQueue();
                // noRequestFoundCount = 0;
            }

            // we have nothing left in our queue. Stop it
            if (this.requests.length === 0 && this.runningRequests === 0) {
                this.stop();
            }

            if (this.runQueue === false) {
                resolve();
            } else {
                // still running? Set a timeout for another queueTimer function call
                setTimeout((): void => {
                    this.queueTimer().then((): void => {
                        resolve();
                    });
                }, this.timerManager);
            }
        });
    }

    /**
     * Run the queue, populate it and let it handle its business.
     * Note: After 4 intervals of having nothing to insert into the queue, the queue stops and the promise is resolved
     */
    public run(): Promise<void> {
        return new Promise((resolve): void => {
            this.runQueue = true;
            this.runningRequests = 0;
            this.queueTimer().then((): void => {
                resolve();
            });
        });
    }

    /**
     * Sets the callback that allows code to be hooked and called whenever a request is done processing
     * By default a empty function is called so this is not needed unless you care about the results of the request
     * @param callback
     */
    public setRequestComplete(callback: (request: Request<PageEngine>) => Promise<void>): void {
        this.callbackRequestComplete = callback;
    }

    /**
     * Get the total amount of workers that this request manager is associated with
     */
    public getMaxQueueSize(): number {
        return this.maxInstances;
    }

    /**
     * Sets the total amount of instances that a queue can have.
     * NOTE: THIS DOES NOT RELATE TO WEB WORKERS OR SERVICE WORKERS. This is purely the amount of request that can be in the queue at one time.
     * NOTE: CHANGING THIS VALUE DOES NOT CLEAR OUT THE QUEUE.
     * @param totalInstances The max amount of instances that the queue is allowed to have at any one point
     */
    public setMaxQueueSize(totalInstances: number = 0): number {
        if (totalInstances === 0) {
            this.autoCalcQueueSize();
        } else {
            this.maxInstances = totalInstances;
        }
        return this.maxInstances;
    }

    /**
     * Auto calculate the queue size based on how many cpu cores are visible to the system.
     * Why use CPU cores vs some arbitary number? It's just a simple and quick solution.
     * At some point I would like to make a Worker Thread version of RequestManager so this might become a bigger player at some point
     */
    private autoCalcQueueSize(): number {
        let cpuCores = os.cpus().length;
        this.maxInstances = cpuCores;
        return this.maxInstances;
    }
}

export default RequestGroup;
