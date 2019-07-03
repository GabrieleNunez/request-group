# Request Manager

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.png?v=101)](https://github.com/ellerbrock/typescript-badges/)


Request Manager is a module for primarily [Node.js](https://nodejs.org/en/) environments and written in [TypeScript](https://www.typescriptlang.org/). The entire purpose is to handle 
batch request of multiple kinds in a friendly and agnostic way. Included in this module are two basic classes called [FileRequest](https://github.com/GabrieleNunez/request-manager/blob/master/src/requests/file_request.ts) and [WebRequest](https://github.com/GabrieleNunez/request-manager/blob/master/src/requests/web_request.ts) to get the ball rolling in your project. These class's are only basic and may not satisfy all your needs. If you are looking to expand or develop your own request type it would be wise to start by extending the [BaseRequest](https://github.com/GabrieleNunez/request-manager/blob/master/src/core/base_request.ts) or [BaseWebRequest](https://github.com/GabrieleNunez/request-manager/blob/master/src/core/base_web_request.ts). If you want to go deeper you can implement the [Request](https://github.com/GabrieleNunez/request-manager/blob/master/src/core/request.ts) interface entirely on your own. This module will of course work in a regular [Node.js](https://nodejs.org/en/) enviorment if that is your preference, but all examples and the preferred way to use this module is to use it with [TypeScript](https://www.typescriptlang.org/). All *.ds.ts files are included when building


## Installing and Building

This module has not yet been published to npm for now you will have to clone this repository and then build from source

```bash

git clone https://github.com/GabrieleNunez/request-manager.git
cd request-manager
npm run build

```

When  this module is published to the npm registry then this section will become "Building"

- - -

## Creating a request manager

Fortunately creating a request manager is extremely simple and straight forward. If you are using [TypeScript]() then RequestManager only requires one type supplied and two parameters.

```typescript
import { RequestManager, WebRequest } from 'request-manager';

// if you dont supply the queue size then the default is 4
const requestQueueSize: number = 4;

// if you don't supply the queue interval then the default is 2500 or 2.5 seconds
// the queue interval is given in millseconds since we use setTimeout
const requestQueueInterval: number = 2500; 

// create a new request manager with a page engine type of string
// the page engine is simply the output of the Request. This could be a class or a primitive.
// For example if we are using Cheerio this **should** be RequestManager<CheerioStatic>
// If we are using puppeteer this **should** be RequestManager<puppeteer.Page>
let foo:RequestManager<string> = new RequestManager<string>(requestQueueSize, requestQueueInterval);

// OR you can also create a request manager by using request.createManager(...) like so
let webRequest: WebRequest = new WebRequest('https://github.com/GabrieleNunez/request-manager');
let bar = webRequest.createManager(requestQueueSize, requestQueueInterval);

// both ways will work just fine and give you a request manager
// after you create your request manager just  queue up the request
foo.queue(webRequest);

// when you are ready to run the queue
foo.run().then(() => {
    console.log('Queue completed');
});

/** 
 * If you wanted to use await
 * await foo.run();
 * console.log('Queue completed');
*/

```


The **PageEngine** Type explained
```
RequestManager<PageEngine>

The PageEngine is the output you are expecting from the request to return. 
If you are using the built in request classes then the output is always going to be string.

To use Puppeteer and Cheerio as examples, if you wanted to create request to extend and return the output of those then the PageEngine **should** be puppeteer.Page or CheerioStatic respectively

```



## How to use ( Extending )

Extending [BaseWebRequest](https://github.com/GabrieleNunez/request-manager/blob/master/src/core/base_web_request.ts) and using [Cheerio](https://cheerio.js.org/) as a page engine

#### **cheerio_request.ts**

```typescript

// File: cheerio_request.ts

import { BaseWebRequest, Request } from 'request-manager';
import * as cheerio from 'cheerio';
import * as moment from 'moment';
import * as URL from 'url';
import * as request from 'request';

export class CheerioRequest extends BaseWebRequest<CheerioStatic> {
    protected userAgent: string | null;
    public constructor(url: string, userAgent: string | null = null) {
        super(url);
        this.userAgent = userAgent;
    }

    /**
     * Properly dispose of any resources that we need to get rid of
     */
    public dispose(): Promise<void> {
        return new Promise((resolve): void => {
            resolve();
        });
    }

    /**
     * Make a request out to the interweb world
     */
    public run(): Promise<Request<CheerioStatic>> {
        let urlTarget = URL.parse(this.requestUrl);
        let urlHost: string | undefined = urlTarget.hostname;
        return new Promise((resolve, reject): void => {
            if (urlHost === undefined) {
                reject();
            } else {
                let headers = {
                    'User-Agent': this.userAgent,
                    Connection: 'keep-alive',
                    Accept: '*/*',
                    Host: urlHost as string,
                };

                if (this.requestCookie && this.requestCookie.trim().length > 0) {
                    headers['Cookie'] = this.requestCookie;
                }

                console.log('Requesting: ' + this.requestUrl);

                request(
                    {
                        method: this.requestMethod,
                        uri: this.requestUrl,
                        headers: headers,
                        jar: typeof headers['Cookie'] == 'undefined' ? true : false,
                        strictSSL: false,
                    },
                    (error, response, body): void => {
                        this.momentPing = moment();
                        this.momentDone = moment();
                        this.requestCompleted = true;
                        this.momentDuration = moment.duration(this.momentInitiated.diff(this.momentDone));
                        this.requestErrors.push(error);
                        this.pageData = cheerio.load(body);
                        console.log('Cheerio Parse complete: ' + this.requestUrl);
                        resolve(this);
                    },
                );
            }
        });
    }
}

export default CheerioRequest;


```

#### **index.ts**
```typescript
// index.ts
import CheerioRequest from './request_type/cheerio_request';
import { RequestManager, Request } from 'request-manager';

function cheerioExample(): Promise<void> {
    return new Promise(
        async (resolve): Promise<void> => {
            // create our request manager object
            let requestManager: RequestManager<CheerioStatic> = new RequestManager<CheerioStatic>(2, 1000);

            // hook in a callback that way we can read and manipulate the page data
            requestManager.setRequestComplete(
                (request: Request<CheerioStatic>): Promise<void> => {
                    return new Promise((requestResolve): void => {
                        let $: CheerioStatic = request.getPage();

                        console.log(request.getMetadata<string>('request-name') + ' Looping through messages');
                        console.log(
                            request.getMetadata<string>('request-name') +
                                ' Total Messages: ' +
                                $('table.files td.message').length,
                        );

                        $('table.files td.message').each((index: number, element: CheerioElement): void => {
                            console.log(request.getMetadata<string>('request-name') + ' Iteration: ' + index);
                            let txt: string = $(element)
                                .text()
                                .trim();

                            if (txt.length > 0) {
                                console.log(request.getMetadata<string>('request-name') + ': ' + txt);
                            }
                        });

                        requestResolve();
                    });
                },
            );

            // these are the things we want to crawl
            let urls: string[] = [
                'https://github.com/GabrieleNunez/request-manager',
                'https://github.com/GabrieleNunez/bronco',
                'https://github.com/GabrieleNunez/thecoconutcoder.com',
                'https://github.com/GabrieleNunez/webcam.js',
            ];

            // loop through our urls and then add them into the queue
            for (var i = 0; i < urls.length; i++) {
                console.log('Adding: ' + urls[i]);
                let cheerioRequest: CheerioRequest = new CheerioRequest(urls[i]);
                let requestName: string | undefined = urls[i].split('/').pop();

                // just in case sanity check
                if (requestName === undefined) {
                    requestName = 'unknown-' + i;
                }

                cheerioRequest.setMetadata<string>('request-name', requestName as string);
                cheerioRequest.setMetadata<number>('request-index', i);

                // queue up the request we just made
                requestManager.queue(cheerioRequest);
            }

            console.log('Letting request queue run');
            await requestManager.run();

            console.log('This request queue has completed');
            resolve();
        },
    );
}

// demonstrate using cheerio for request
cheerioExample().then((): void => {
    console.log('Completed');
});


```
- - -

## How to use (Built in File)
#### **index.ts**
```typescript
import { RequestManager, Request, FileRequest } from 'request-manager';


function fileExample(): Promise<void> {
    return new Promise(
        async (resolve): Promise<void> => {
            // create our request manager object
            let requestManager: RequestManager<string> = new RequestManager<string>(2, 2000);
            requestManager.setRequestComplete(
                (request: Request<string>): Promise<void> => {
                    return new Promise((requestResolve): void => {
                        let fileRequest: FileRequest = request as FileRequest;
                        console.log('File read');

                        let fileContents: string = request.getPage();
                        console.log('- - -');
                        console.log(request.getMetadata<string>('name'));
                        console.log(
                            'Access: ' +
                                fileRequest.getFileAccessTime().format('dddd, MMMM Do YYYY, h:mm:ss a') +
                                '\tModified: ' +
                                fileRequest.getFileModifiedTime().format('dddd, MMMM Do YYYY, h:mm:ss a') +
                                '\tCreated: ' +
                                fileRequest.getFileCreatedTime().format('dddd, MMMM Do YYYY, h:mm:ss a'),
                        );
                        console.log('- - -');
                        console.log(fileContents);
                        console.log('- - -');

                        requestResolve();
                    });
                },
            );

            let filePaths: string[] = [
                'tsconfig.json',
                'package.json',
                '.eslintrc.js',
                '.prettierrc.js',
                '.eslintignore',
            ];

            for (var i = 0; i < filePaths.length; i++) {
                let request: FileRequest = new FileRequest(filePaths[i]);
                let fileName: string | undefined = filePaths[i].split('/').pop();
                if (fileName === undefined) {
                    fileName = 'unknown-' + i;
                }
                request.setMetadata<string>('name', fileName);
                requestManager.queue(request);
            }

            console.log('Letting file request run');
            await requestManager.run();
            console.log('Request completed!');

            resolve();
        },
    );
}

// demonstrate files using the included file request
fileExample().then((): void => {
    console.log('Completed');
});

```
- - -

## Found a problem? Have a suggestion? Want a feature?

I am looking to colloborate more with other developers. All issues will be addresses ASAP and pull request's welcomed. Let's make something great


- - -

## Development Dependencies

* @types/node ^12.0.10
* @types/request ^2.48.1
* @typescript-eslint/eslint-plugin ^ 1.11.0
* @typescript-eslint/parser ^ 1.11.1
* eslint ^6.0.1
* eslint-config-prettier ^ 6.0.0
* eslint-plugin-prettier ^ 3.1.0
* prettier ^ 1.18.2
* ts-node ^ 8.3.0
* typescript ^ 3.5.2

## Library Dependencies

* moment ^ 2.24.0
* request ^ 2.88.0


## Keywords

request scraping manager http file utility browser async asynchronous web eslint typescript prettier moment