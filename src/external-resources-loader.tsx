import * as React from 'react';

const ElementTag = 'external-resources';

function loadScript(src: string, id: string) {
    const s: HTMLScriptElement = document.createElement('script');
    s.async = false;
    s.id = id;
    s.src = src;

    const er = document.getElementById(ElementTag);
    if (er === null)
        throw new Error(`Element ${ElementTag} is not available`);

    er.appendChild(s);
}

export class ExternalResourcesLoader extends React.Component {
    componentDidMount() {
        loadScript('./molstar.js', 'molstar-app');
    }

    render() {
        return (
            <span id={ElementTag}></span>
        );
    }
}