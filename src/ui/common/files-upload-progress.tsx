/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

export class FilesUploadProgress extends React.Component<FilesUploadProgress.Props> {
    private renderUploadState(info: FilesUploadProgress.Info) {
        switch (info.uploadState) {
            case 'not-started':
                return (<div className='file-upload-state'>Not started - 0&nbsp;%</div>);
            case 'in-progress':
                return (<div className='file-upload-state'>Uploading... - {`${(100 * info.doneRatio).toFixed(1)}`}&nbsp;%</div>);
            case 'done':
                return (<div className='file-upload-state-done'>Done</div>);
            case 'failed':
                return (<div className='file-upload-state-failed'>{info.error}</div>);
            case 'canceled':
                return (<div className='file-upload-state-failed'>Canceled</div>);
        }
    }

    render() {
        return (
            <div className='files-upload-progress-container'>
                <div className='section-caption'>Current file transfers</div>
                <div className='files-upload-progress-list'>
                    {this.props.infos.map((info, idx) => {
                        return (
                            <React.Fragment key={idx}>
                                <div className='file-upload-name'>{info.fileName}</div>
                                {this.renderUploadState(info)}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export namespace FilesUploadProgress {
    export type UploadState = 'not-started' | 'in-progress' | 'done' | 'failed' | 'canceled';

    export interface Info {
        fileName: string;
        uploadState: UploadState;
        doneRatio: number;
        error: string;
    }

    export interface Props {
        infos: Info[];
    }
}
