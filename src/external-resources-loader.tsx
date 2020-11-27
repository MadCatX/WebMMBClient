/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

const ElementTag = 'external-resources';

function loadScript(src: string, id: string) {
    const s: HTMLScriptElement = document.createElement('script');
    s.async = false;
    s.defer = false;
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