/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isExtResAvailable } from './external-resources-loader';
import { ExampleList } from './ui/example-list';
import { JobList } from './ui/job-list';
import { Logout } from './ui/logout';
import { TabsBar } from './ui/tabs-bar';
import { VisualJobRunner } from './ui/visual-job-runner';
import { ExternalResourcesLoader } from './external-resources-loader';
import { Net } from './util/net';
import { versionInfo } from './version';
import {AppQuery} from './mmb/app-query';

type Tabs = 'job-list' | 'job-control' | 'example-list';

interface State {
    session_id?: string; // TODO: camelCase
    jobId: string|null;
    activeTab: Tabs;
}

interface Props {
}

const NavTabsBar = TabsBar<Tabs>();

export class Main extends React.Component<Props, State> {
    private sessionInfoAborter: AbortController | null = null;

    constructor(props: Props) {
        super(props);

        this.state = {
            session_id: undefined,
            jobId: null,
            activeTab: 'job-list',
        };

        this.onSelectJob = this.onSelectJob.bind(this);
        this.onTabChanged = this.onTabChanged.bind(this);
        this.onExampleSelected = this.onExampleSelected.bind(this);
    }

    private canSwitchToControl() {
        return this.state.session_id !== undefined && this.state.jobId !== null && this.isMolstarLoaded();
    }

    private isMolstarLoaded() {
        return isExtResAvailable('molstar-app');
    }

    private onExampleSelected(jobId: string) {
        this.onSelectJob(jobId);
    }

    private onSelectJob(jobId: string) {
        if (!this.isMolstarLoaded())
            return;

        this.setState({
            ...this.state,
            activeTab: 'job-control',
            jobId,
        });
    }

    private onTabChanged(id: Tabs) {
        if (id === this.state.activeTab)
            return;
        if (id === 'job-control' && !this.canSwitchToControl())
            return;

        const jobId = id !== 'job-control' ? null : this.state.jobId;

        this.setState({
            ...this.state,
            activeTab: id,
            jobId,
        });
    }

    private renderTab(id: Tabs) {
        switch (id) {
        case 'job-list':
            return (
                <JobList
                    onSelectJob={this.onSelectJob}
                />
            );
        case 'job-control':
            if (!this.canSwitchToControl())
                return;

            return (
                <VisualJobRunner
                    username={this.state.session_id!}
                    jobId={this.state.jobId!}
                />
            );
        case 'example-list':
            return (
                <ExampleList
                    onExampleSelected={this.onExampleSelected} />
            );
        }
    }

    componentDidMount() {
        Net.abortFetch(this.sessionInfoAborter);

        const { aborter, performer } = AppQuery.sessionInfo();
        this.sessionInfoAborter = aborter;

        performer().then(info => {
            if (!info)
                return;

            this.setState({
                ...this.state,
                session_id: info.id,
            });
        }).catch(e => {
            console.error(e);
        });
    }

    componentWillUnmount() {
        Net.abortFetch(this.sessionInfoAborter);
    }

    render() {
        const verinfo = versionInfo();

        return (
            <div id='main-container'>
                <ExternalResourcesLoader />
                <div className='top-panel'>
                    <NavTabsBar
                        tabs={[
                            { id: 'job-list', caption: 'Jobs' },
                            { id: 'job-control', caption: 'Control' },
                            { id: 'example-list', caption: 'Examples' },
                        ]}
                        activeTab={this.state.activeTab}
                        changeTab={this.onTabChanged}
                        className='main-navbar' />
                    <Logout username={this.state.session_id} />
                </div>
                <div className='main-block'>
                    {this.renderTab(this.state.activeTab)}
                </div>
                <div className='footer'>
                    <div className='version-info-text'>{`Version: ${verinfo.date} (${verinfo.rev})`}</div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('app'));