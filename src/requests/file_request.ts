import BaseRequest from '../core/base_request';
import Request from '../core/request';
import * as moment from 'moment';
import * as fs from 'fs';

export class FileRequest extends BaseRequest<string> {
    protected momentFileAccessed: moment.Moment;
    protected momentFileCreated: moment.Moment;
    protected momentFileModified: moment.Moment;

    /**
     * Construct our file request
     * @param filePath The location of the file
     */
    public constructor(filePath: string) {
        super(filePath);

        this.momentFileAccessed = moment();
        this.momentFileCreated = moment();
        this.momentFileModified = moment();
    }

    /**
     * Gets the file access time of the file.
     * Note: if method is called before the request is ran it won't return an accurate time
     */
    public getFileAccessTime(): moment.Moment {
        return this.momentFileAccessed;
    }

    /**
     * Gets the file creation time
     * Note: if method is called before the request is ran it won't return an accurate time
     */
    public getFileCreatedTime(): moment.Moment {
        return this.momentFileCreated;
    }

    /**
     * Gets the file modification time of the file.
     * Note: if method is called before the request is ran it won't return an accurate time
     */
    public getFileModifiedTime(): moment.Moment {
        return this.momentFileModified;
    }

    /**
     * Dispose of anything if possible
     */
    public dispose(): Promise<void> {
        return new Promise((resolve): void => {
            resolve();
        });
    }

    /**
     * Run the request and grab the contents of the file
     */
    public run(): Promise<Request<string>> {
        return new Promise((resolve, reject): void => {
            this.momentInitiated = moment();
            fs.stat(this.requestUrl, (err: NodeJS.ErrnoException | null, stats: fs.Stats): void => {
                // no errors and this path is in fact a file
                if (err === null && stats.isFile()) {
                    this.momentFileAccessed = moment.unix(stats.atimeMs / 1000);
                    this.momentFileCreated = moment.unix(stats.ctimeMs / 1000);
                    this.momentFileModified = moment.unix(stats.mtimeMs / 1000);
                    fs.readFile(this.requestUrl, 'utf-8', (fileError: NodeJS.ErrnoException, data: string): void => {
                        if (fileError === null) {
                            this.momentPing = moment();
                            this.momentDone = moment();
                            this.requestCompleted = true;
                            this.momentDuration = moment.duration(this.momentInitiated.diff(this.momentDone));
                            this.pageData = data;
                            resolve(this);
                        } else {
                            reject(fileError);
                        }
                    });
                } else {
                    reject(err);
                }
            });
        });
    }
}

export default FileRequest;
