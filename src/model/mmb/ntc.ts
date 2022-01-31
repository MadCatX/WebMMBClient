/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export namespace NtC {
    export const DefaultForceScaleFactor = 3000;

    export const Conformers = [
        //AA
        'AA00',
        'AA01',
        'AA02',
        'AA03',
        'AA04',
        'AA05',
        'AA06',
        'AA07',
        'AA08',
        'AA09',
        'AA10',
        'AA11',
        'AA12',
        'AA13',
        //AB
        'AB01',
        'AB02',
        'AB03',
        'AB04',
        'AB05',
        //BA
        'BA01',
        'BA05',
        'BA09',
        'BA08',
        'BA10',
        'BA13',
        'BA16',
        'BA17',
        //BB
        'BB00',
        'BB01',
        'BB17',
        'BB02',
        'BB03',
        'BB11',
        'BB16',
        'BB04',
        'BB05',
        'BB07',
        'BB08',
        'BB10',
        'BB12',
        'BB13',
        'BB14',
        'BB15',
        'BB20',
        //IC
        'IC01',
        'IC02',
        'IC03',
        'IC04',
        'IC05',
        'IC06',
        'IC07',
        //OP
        'OP01',
        'OP02',
        'OP03',
        'OP04',
        'OP05',
        'OP06',
        'OP07',
        'OP08',
        'OP09',
        'OP10',
        'OP11',
        'OP12',
        'OP13',
        'OP14',
        'OP15',
        'OP16',
        'OP17',
        'OP18',
        'OP19',
        'OP20',
        'OP21',
        'OP22',
        'OP23',
        'OP24',
        'OP25',
        'OP26',
        'OP27',
        'OP28',
        'OP29',
        'OP30',
        'OP31',
        'OPS1',
        'OP1S',
        //SYN
        'AAS1',
        'AB1S',
        'AB2S',
        'BB1S',
        'BB2S',
        'BBS1',
        'ZZ01',
        'ZZ02',
        'ZZ1S',
        'ZZ2S',
        'ZZS1',
        'ZZS2',
    ];
    export type Conformer = typeof Conformers[number];

    export function conformerAsString(cfmr: Conformer) {
        return cfmr.toString();
    }

    export function isConformer(id: string): id is Conformer {
        return Conformers.includes(id);
    }

    export class Conformation implements Comparable, Cloneable {
        constructor(readonly chainName: string, readonly firstResNo: number, readonly lastResNo: number, readonly ntc: NtC.Conformer) {
        }

        clone() {
            return new Conformation(this.chainName, this.firstResNo, this.lastResNo, this.ntc);
        }

        equals(other: Conformation) {
            return this.chainName === other.chainName &&
                   this.firstResNo === other.firstResNo &&
                   this.lastResNo === other.lastResNo &&
                   this.ntc === other.ntc;
        }

        toString() {
            return `${this.chainName} ${this.firstResNo} -> ${this.lastResNo}`;
        }
    }

    export class NtCs {
        constructor(readonly conformations: Conformation[], readonly forceScaleFactor: number) {
            if (forceScaleFactor < 0)
                throw new Error('Force scale factor must be non-negative');
        }

        static empty() {
            return new NtCs([], DefaultForceScaleFactor);
        }
    }
}
