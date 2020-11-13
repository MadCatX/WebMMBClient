import * as React from 'react';

export class MmbCommands extends React.Component<MmbCommands.Props> {
    render() {
        return (
            <div className="section">
                <div className="section-caption">MMB commands</div>
                <pre className="verbatim">
                    {this.props.commands.map((line) => `${line}\n`)}
                </pre>
            </div>
        )
    }
}

export namespace MmbCommands {
    export interface Props {
        commands: string[];
    }
}
