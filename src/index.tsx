/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { JobList } from './ui/job-list';
import { Logout } from './ui/logout';
import { TabsBar } from './ui/tabs-bar';
import { VisualJobRunner } from './ui/visual-job-runner';
import { ExternalResourcesLoader } from './external-resources-loader';
import * as Api from './mmb/api';
import { JsonCommands } from './mmb/commands';

type Tabs = 'job-list' | 'job-control';

type ActiveJob = {
    info: Api.JobInfo,
    commands: JsonCommands,
}

interface State {
    activeTab: Tabs;
    activeJob?: ActiveJob;
}

interface Props {
}

const NavTabsBar = TabsBar<Tabs>();

export class Main extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            activeTab: 'job-list',
            activeJob: undefined,
        };

        this.onSelectJob = this.onSelectJob.bind(this);
        this.onJobDeleted = this.onJobDeleted.bind(this);
        this.onJobStarted = this.onJobStarted.bind(this);
        this.onTabChanged = this.onTabChanged.bind(this);
    }

    private onJobDeleted(id: string) {
        if (this.state.activeJob?.info.id === id) {
            this.setState({
                ...this.state,
                activeJob: undefined,
            });
        }
    }

    private onSelectJob(info?: Api.JobInfo, commands?: JsonCommands) {
        const aj = (() => {
            if (info !== undefined && commands !== undefined)
                return { info, commands };
            return undefined;
        })();

        this.setState({
            ...this.state,
            activeTab: 'job-control',
            activeJob: aj,
        });
    }

    private onJobStarted(info: Api.JobInfo, commands: JsonCommands) {
        this.setState({
            ...this.state,
            activeJob: { info, commands },
        });
    }

    private onTabChanged(id: Tabs) {
        console.log(id);
        this.setState({ ...this.state, activeTab: id });
    }

    private renderTab(id: Tabs) {
        switch (id) {
        case 'job-list':
            return (
                <JobList
                    onSelectJob={this.onSelectJob}
                    jobDeleted={this.onJobDeleted} />);
        case 'job-control':
            return (
                <VisualJobRunner
                    onJobStarted={this.onJobStarted}
                    info={this.state.activeJob?.info}
                    commands={this.state.activeJob?.commands} />
            );
        }
    }

    render() {
        return (
            <>
                <ExternalResourcesLoader />
                <div className='top-panel'>
                    <NavTabsBar
                        tabs={[
                            { id: 'job-list', caption: 'Jobs' },
                            { id: 'job-control', caption: 'Control' },
                        ]}
                        activeTab={this.state.activeTab}
                        changeTab={this.onTabChanged}
                        className='main-navbar' />
                    <Logout />
                </div>
                <div className='main-block'>
                    {this.renderTab(this.state.activeTab)}
                </div>
            </>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('app'));