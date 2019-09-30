import Request from '../core/request';
import BaseWebRequest from '../core/base_web_request';
import * as request from 'request';
import * as URL from 'url';
import moment = require('moment');

export class JSONRequest<JSONFormat extends {}> extends BaseWebRequest<JSONFormat> {
    protected userAgent: string | null;
    public constructor(url: string, userAgent: string | null = null) {
        super(url);
        if (userAgent === null) {
            userAgent = 'curl/7.62.0';
        }
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
    public run(): Promise<Request<JSONFormat>> {
        let urlTarget = URL.parse(this.requestUrl);
        let urlHost: string | undefined = urlTarget.hostname;
        return new Promise(
            async (resolve, reject): Promise<void> => {
                if (urlHost === undefined) {
                    reject();
                } else {
                    let headers = {
                        'User-Agent': this.userAgent,
                        Connection: 'keep-alive',
                        DNT: '1',
                        Accept: '*/*',
                        Host: urlHost,
                        'Upgrade-Insecure-Requests': '1',
                        Pragma: 'no-cache',
                        'Cache-Control': 'no-cache',
                        'X-Requested-With': 'XMLHttpRequest',
                    };

                    request(
                        {
                            method: this.requestMethod,
                            uri: this.requestUrl,
                            headers: headers,
                            strictSSL: false,
                        },
                        (error, response, body): void => {
                            this.momentPing = moment();
                            this.momentDone = moment();
                            this.requestCompleted = true;
                            this.momentDuration = moment.duration(this.momentInitiated.diff(this.momentDone));
                            this.requestErrors.push(error);
                            try {
                                this.pageData = !error ? JSON.parse(body) : null;
                            } catch {
                                this.pageData = null;
                            }
                            resolve(this);
                        },
                    );
                }
            },
        );
    }
}
