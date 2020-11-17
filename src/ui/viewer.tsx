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

export class Viewer extends React.Component<Viewer.Props> {
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
            </div>
        );
    }
}

export namespace Viewer {
    export interface Props {
        structureUrl?: string;
        structureName?: string;
        stage: number | 'last';
    }
}