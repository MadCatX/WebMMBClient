import * as React from 'react';
import { PushButton } from './common/push-button';

export class JobControls extends React.Component<JobControls.Props, JobControls.State> {
    render() {
        return (
            <div>
                <div className='job-controls-btns'>
                    <PushButton
                        className='pushbutton-start'
                        value='Start'
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStart();
                        }} />
                    <PushButton
                        className='pushbutton-flex'
                        value='Status'
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStatus();
                        }} />
                    <PushButton
                        className='pushbutton-stop'
                        value='Stop'
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStop();
                        }} />
                </div>
            </div>
        );
    }
}

export namespace JobControls {
    export interface Props {
        handleStart: () => void;
        handleStatus: () => void;
        handleStop: () => void;
    }

    export interface State {
    }
}
