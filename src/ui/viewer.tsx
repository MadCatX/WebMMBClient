/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { LinkButton } from './common/link-button';
import { PushButton } from './common/push-button';

declare let WebMmbViewer: any;

interface State {
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number | null;
}

export class Viewer extends React.Component<Viewer.Props, State> {
    constructor(props: Viewer.Props) {
        super(props);

        this.state = {
            autoRefreshEnabled: this.props.defaultAutoRefreshEnabled,
            autoRefreshInterval: this.props.defaultAutoRefreshInterval,
        };
    }
    private async initAndLoad() {
        await WebMmbViewer.init(document.getElementById('viewer'));
        this.load();
    }

    private load() {
        const url = this.url();
        if (url !== undefined)
            WebMmbViewer.load(url, 'pdb');
    }

    private switchRepresentation(repr: 'ball-and-stick' | 'cartoon') {
        WebMmbViewer.setRepresentation(repr);
    }

    private url() {
        if (this.props.structureUrl === undefined)
            return undefined;
        return `./${this.props.structureUrl}/${this.props.stage}`;
    }

    componentDidMount() {
        this.initAndLoad();
    }

    componentDidUpdate() {
        this.load();
    }

    render() {
        return (
            <div className='viewer-container'>
                <div id='viewer'></div>
                <div className='viewer-controls'>
                    <PushButton
                        className='pushbutton-flex pushbutton-hc-default'
                        value='Ball-and-stick'
                        onClick={() => this.switchRepresentation('ball-and-stick')} />
                    <PushButton
                        className='pushbutton-flex pushbutton-hc-default'
                        value='Cartoon'
                        onClick={() => this.switchRepresentation('cartoon')} />
                    <LinkButton
                        className='pushbutton-flex pushbutton-hc-default'
                        value='Download'
                        url={this.url() ?? ''}
                        downloadAs={`${this.props.structureName}.pdb`} />
                </div>
                <div className='padded'>
                    <span className='padded'>Refresh rate (sec):</span>
                    <input
                        type='text'
                        onChange={
                            (e) => {
                                const val = (() => {
                                    const v = e.currentTarget.value;
                                    if (v.length === 0)
                                        return null;
                                    const i = parseInt(v);
                                    if (i <= 0)
                                        throw new Error('Invalid interval value');
                                    return i;
                                })();
                                this.setState({...this.state, autoRefreshInterval: val});
                                if (val !== null)
                                    this.props.autoRefreshChanged(this.state.autoRefreshEnabled, val);
                            }
                        }
                        value={this.state.autoRefreshInterval === null ? '' : this.state.autoRefreshInterval}
                        className='padded' />
                    <span className='padded'>Auto:</span>
                    <input
                        type='checkbox'
                        onChange={
                            (e) => {
                                const chk = e.currentTarget.checked;
                                this.setState({...this.state, autoRefreshEnabled: chk});
                                if (this.state.autoRefreshInterval !== null)
                                    this.props.autoRefreshChanged(chk, this.state.autoRefreshInterval);
                            }
                        }
                        checked={this.state.autoRefreshEnabled}
                        className='padded' />
                </div>
            </div>
        );
    }
}

export namespace Viewer {
    export interface AutoRefreshChanged {
        (enabled: boolean, interval: number): void;
    }

    export interface Props {
        structureUrl?: string;
        structureName?: string;
        stage: number | 'last';
        autoRefreshChanged: AutoRefreshChanged;
        defaultAutoRefreshEnabled: boolean;
        defaultAutoRefreshInterval: number;
    }
}