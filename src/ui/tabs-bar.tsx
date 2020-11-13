/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { TabButton } from './tab-button';

export class GTabsBar<T> extends React.Component<TabsBar.Props<T>> {
    constructor(props: TabsBar.Props<T>) {
        super(props);

        this.onTabClicked = this.onTabClicked.bind(this);
    }

    private onTabClicked(id: T) {
        if (id !== this.props.activeTab)
            this.props.changeTab(id);
    }

    render() {
        return (
            <div className={this.props.className ?? 'tabs-bar'}>
                {this.props.tabs.map((e, n) => {
                    const key = `{tab-${n}}`;
                    return (
                        <TabButton
                            key={key}
                            isActive={this.props.activeTab === e.id}
                            value={e.caption}
                            onClick={() => this.onTabClicked(e.id)} />
                    );
                })}
            </div>
        );
    }
}

export namespace TabsBar {
    export interface ChangeTab<T> {
        (id: T): void;
    }

    export interface Tab<T> {
        id: T;
        caption: string;
    }

    export interface Props<T> {
        tabs: Tab<T>[];
        changeTab: ChangeTab<T>;
        activeTab: T;
        className?: string;
    }
}

export function TabsBar<T>() {
    return GTabsBar as new(props: TabsBar.Props<T>) => GTabsBar<T>;
}