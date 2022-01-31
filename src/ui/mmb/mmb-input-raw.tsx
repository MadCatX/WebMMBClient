/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { TextArea } from '../common/controlled/text-area';

export class MmbInputRaw extends React.Component<MmbInputRaw.Props> {
    render() {
        return (
            <div>
                <div className='warning-message'>
                    Warning: Commands entered in this mode will be submitted directly to MMB with no additional validation. You are on a highway to the danger zone unless you know what you are doing.
                </div>
                <div>
                    <TextArea
                        id='mmb-in-raw-commands'
                        className='text-area text-area-full-width'
                        spellcheck={false}
                        resizeMode={'vertical'}
                        rows={30}
                        value={this.props.commands}
                        updateNotifier={v => this.props.onChanged(v)}
                    />
                </div>
            </div>
        );
    }
}

export namespace MmbInputRaw {
    export interface Props {
        commands: string;
        onChanged(v: string): void;
    }
}