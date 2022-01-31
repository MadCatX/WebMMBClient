import { Subject } from 'rxjs';
import { AdditionalFile } from './additional-file';
import { AdvancedParameters } from './advanced-parameters';
import { BaseInteraction } from './base-interaction';
import { Compound } from './compound';
import { DensityFitFiles } from './density-fit-files';
import { DoubleHelix } from './double-helix';
import { GlobalConfig } from './global-config';
import { MdParameters } from './md-parameters';
import { Mobilizer } from './mobilizer';
import { NtC } from './ntc';
import { Parameter as P } from './parameter';
import { Reporting } from './reporting';
import { StagesSpan } from './stages-span';
import { FileInputParameterNames, Parameters } from '../../mmb/available-parameters';
import { Comparable } from '../../util/comparable';
import { EventsKeeper } from '../../util/events-keeper';
import { Num } from '../../util/num';
import { Cloneable } from '../../util/cloneable';
import { Dearray } from '../../util/types';

export namespace MmbSetup {
    export type Data = {
        additionalFiles: AdditionalFile[],
        advancedParameters: AdvancedParameters.Type,
        baseInteractions: BaseInteraction[],
        densityFitFiles: DensityFitFiles,
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        global: GlobalConfig,
        md: MdParameters,
        mobilizers: Mobilizer[],
        ntcs: NtC.Conformation[],
        ntcForceScaleFactor: number,
        reporting: Reporting,
        stage: number,
        stages: StagesSpan,
    }
}

type ScalarData = Pick<MmbSetup.Data,
    'advancedParameters' | 'global' | 'densityFitFiles' |
    'md' | 'ntcForceScaleFactor' | 'reporting' |
    'stage' | 'stages'
>
const _scalarData: ScalarData = {
    advancedParameters: new AdvancedParameters.Type(),
    densityFitFiles: new DensityFitFiles(null, null),
    global: GlobalConfig.default(),
    md: new MdParameters(false),
    ntcForceScaleFactor: 0,
    reporting: new Reporting(0, 0),
    stage: 0,
    stages: new StagesSpan(0, 0),
};
function isScalarDataKey(k: keyof MmbSetup.Data): k is keyof ScalarData {
    for (const pk in _scalarData) {
        if (k === pk)
            return true;
    }
    return false;
}

type VectorData = Omit<MmbSetup.Data, keyof ScalarData>
function isVectorDataKey(k: keyof MmbSetup.Data): k is keyof VectorData {
    return !isScalarDataKey(k);
}

interface VectorValidationFunc<T> {
    (v: T, data: MmbSetup.Data, vs: T[]): string[]|undefined;
}
type VectorValidators = {
    [K in keyof VectorData]: VectorValidationFunc<Dearray<MmbSetup.Data[K]>>
}

interface ScalarValidationFunc<T> {
    (v: T, data: MmbSetup.Data): string[]|undefined;
}
type ScalarValidators = {
    [K in keyof ScalarData]: ScalarValidationFunc<MmbSetup.Data[K]>
}

type Events = {
    [K in keyof MmbSetup.Data]: Subject<MmbSetup.Data[K]>
}

function copyArray<T extends Cloneable>(src: T[]): T[] {
    return src.map(i => i.clone()) as T[];
}

function findDuplicates<T extends Comparable>(a: Array<T>, comparator?: (a: T, b: T) => boolean) {
    const duplicates = new Array<T>();

    const len = a.length;
    for (let idx = 0; idx < len - 1; idx++) {
        const i = a[idx];
        for (let jdx = idx + 1; jdx < len; jdx++) {
            const j = a[jdx];
            if (comparator) {
                if (comparator(i, j))
                    duplicates.push(i);
            } else {
                if (i.equals(a[jdx]))
                    duplicates.push(i);
            }
        }
    }

    return duplicates;
}

function getIndex<T extends Comparable>(e: T, a: T[]) {
    for (let idx = 0; idx < a.length; idx++) {
        if (a[idx].equals(e))
            return idx;
    }
    return -1;
}

export class MmbSetup {
    private data = MmbSetup.emptyData();

    private readonly vectorValidators: VectorValidators = {
        additionalFiles: this.validateAdditionalFile,
        baseInteractions: this.validateBaseInteraction,
        compounds: this.validateCompound,
        doubleHelices: this.validateDoubleHelix,
        mobilizers: this.validateMobilizer,
        ntcs: this.validateNtC,
    }

    private readonly scalarValidators: ScalarValidators = {
        advancedParameters: this.validateAdvancedParameter,
        densityFitFiles: this.validateDensityFitFiles,
        global: this.validateGlobal,
        md: () => void 0,
        ntcForceScaleFactor: v => v < 0 ? ['NtC force scale factor cannot be negative'] : void 0,
        reporting: this.validateReporting,
        stage: this.validateStage,
        stages: this.validateStages,
    }

    private ek = new EventsKeeper();

    readonly events: Events = {
        additionalFiles: this.ek.subject(),
        advancedParameters: this.ek.subject(),
        baseInteractions: this.ek.subject(),
        compounds: this.ek.subject(),
        densityFitFiles: this.ek.subject(),
        doubleHelices: this.ek.subject(),
        global: this.ek.subject(),
        md: this.ek.subject(),
        mobilizers: this.ek.subject(),
        ntcs: this.ek.subject(),
        ntcForceScaleFactor: this.ek.subject(),
        reporting: this.ek.subject(),
        stage: this.ek.subject(),
        stages: this.ek.subject(),
    }

    /** Event fired when any value in the model changes */
    readonly anything: Subject<void> = this.ek.subject();

    /**
     * If additional files change we need to make
     * sure that none of our advanced parameters points
     * to an additional file that does not exist
     */
    private fixupAdvancedParameters() {
        for (const [name, value] of this.data.advancedParameters.entries()) {
            if (!AdvancedParameters.isFileInputParameter(name))
                continue;

            if (!this.data.additionalFiles.find(f => f.name === value)) {
                this.data.advancedParameters.set(name, this.data.additionalFiles[0]?.name ?? undefined);
            } else if (value === undefined && this.data.additionalFiles.length > 0) {
                this.data.advancedParameters.set(name, this.data.additionalFiles[0].name);
            }
        }
    }

    private notify<K extends keyof Events>(k: K, fireAnything = true) {
        const payload = this.data[k];
        this.events[k].next(payload as any);
        if (fireAnything)
            this.anything.next();
    }

    private notifyMultiple<K extends keyof Events>(ks: K[], fireAnything = true) {
        for (const k of ks)
            this.notify(k, false);
        if (fireAnything)
            this.anything.next();
    }

    private postAdd<K extends keyof VectorData>(k: K) {
        if (k === 'additionalFiles')
            this.fixupAdvancedParameters();
        this.notify(k);
    }

    private postRemove<K extends keyof VectorData>(k: K) {
        if (k === 'compounds') {
            const changed = this.removeInvalidated();
            changed.push('compounds');
            this.notifyMultiple(changed);
        } else if (k === 'additionalFiles') {
            this.fixupAdvancedParameters();
            this.notify(k);
        } else
            this.notify(k);
    }

    /**
     * Removes all data that have been invalidated by a change of some other data in the model
     */
    private removeInvalidated() {
        const changedArrays: (keyof VectorData)[] = [];

        /* If a compound was removed we need to remove all data that link to the removed compound */
        const chains = this.data.compounds.map(c => c.chain.name);

        /* WARNING: Beware that this is rather type-unsafe. Watch your step! */
        const objsToRemove = new Array<any>();
        const prune = <K extends keyof VectorData>(k: K) => {
            if (objsToRemove.length === 0)
                return;

            const d = this.data[k];
            const filtered: (typeof d) = [];

            for (const item of d) {
                if (!(objsToRemove).find(x => x.equals(item)))
                    filtered.push(item as any);
            }
            this.data[k] = filtered;

            changedArrays.push(k);
            objsToRemove.length = 0;
        };

        for (let idx = 0; idx < this.data.baseInteractions.length; idx++) {
            const bi = this.data.baseInteractions[idx];
            if (!chains.includes(bi.chainNameA) || !chains.includes(bi.chainNameB))
                objsToRemove.push(bi);
        }
        prune('baseInteractions');

        for (let idx = 0; idx < this.data.doubleHelices.length; idx++) {
            const dh = this.data.doubleHelices[idx];
            if (!chains.includes(dh.chainNameA) || !chains.includes(dh.chainNameB))
                objsToRemove.push(dh);
        }
        prune('doubleHelices');

        for (let idx = 0; idx < this.data.mobilizers.length; idx++) {
            const m = this.data.mobilizers[idx];
            if (m.chainName && !chains.includes(m.chainName))
                objsToRemove.push(m);
        }
        prune('mobilizers');

        for (let idx = 0; idx < this.data.ntcs.length; idx++) {
            const cfm = this.data.ntcs[idx];
            if (!chains.includes(cfm.chainName))
                objsToRemove.push(cfm);
        }
        prune('ntcs');

        return changedArrays;
    }

    private validateAdditionalFile(f: AdditionalFile, _data: MmbSetup.Data, fs: AdditionalFile[]) {
        const errors = new Array<string>();
        const duplicates = findDuplicates(fs, (a, b) => a.name === b.name);

        if (f.name === '')
            errors.push('File name cannot be empty');

        for (const d of duplicates)
            errors.push(`File ${d.name} already exists`);

        return errors.length > 0 ? errors : void 0;
    }

    private validateAdvancedParameter(advParams: AdvancedParameters.Type, data: MmbSetup.Data) {
        const errors = new Array<string>();
        const partData = { additionalFiles: data.additionalFiles };

        for (const [name, value] of advParams) {
            const param = Parameters.get(name)!;
            const arg = AdvancedParameters.getArgument(param, partData);

            if (P.isIntegralArg(arg)) {
                const num = Num.parseIntStrict(value);
                if (!arg.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isRealArg(arg)) {
                const num = Num.parseFloatStrict(value);
                if (!arg.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isTextualArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isBooleanArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isOptionsArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value))) {
                    const allowed = AdvancedParameters.getArgument(param, partData).options()!;
                    if (!value) {
                        if (allowed.length > 0)
                            errors.push(`${name} is invalid`);
                    } else {
                        // Ignore if option value is invalid if the options are additional files
                        if (!FileInputParameterNames.includes(name)) {
                            if (allowed.length === 0)
                                errors.push(`${name} is invalid`);
                            else if (!allowed.includes(value as string))
                                errors.push(`${name} is invalid`);
                        }
                    }
                }
            }
        }

        return errors.length > 0 ? errors : void 0;
    }

    private validateBaseInteraction(bi: BaseInteraction, data: MmbSetup.Data) {
        // NOTE: We do not check for duplicates here
        const errors = new Array<string>();

        const cOne = data.compounds.find(c => c.chain.name === bi.chainNameA);
        if (!cOne)
            errors.push(`Chain ${bi.chainNameA} does not exist`);
        const cTwo = data.compounds.find(c => c.chain.name === bi.chainNameB);
        if (!cTwo)
            errors.push(`Chain ${bi.chainNameB} does not exist`);

        if (!cOne || !cTwo)
            return errors;

        if (bi.resNoA < cOne.firstResidue.number || bi.resNoA > cOne.lastResidue.number)
            errors.push('Invalid number of first residue');
        if (bi.resNoB < cTwo.firstResidue.number || bi.resNoB > cTwo.lastResidue.number)
            errors.push('Invalid number of second residue');

        if (bi.chainNameA === bi.chainNameB && bi.resNoA === bi.resNoB)
            errors.push('Residue cannot interact with itself');

        return errors.length > 0 ? errors : undefined;
    }

    private validateCompound(_c: Compound, _data: MmbSetup.Data, cs: Compound[]) {
        const errors = new Array<string>();
        const duplicates = findDuplicates(cs, (a, b) => a.chain.name === b.chain.name);

        for (const d of duplicates)
            errors.push(`Component with chain ${d.chain.name} is already present`);

        return errors.length > 0 ? errors : void 0;
    }

    private validateDensityFitFiles(files: DensityFitFiles, _data: MmbSetup.Data) {
        if (files.structure && files.densityMap) {
            if (files.structure.equals(files.densityMap))
                return ['Structure and density map files appear to be the same file'];
        }

        return void 0;
    }

    private validateDoubleHelix(dh: DoubleHelix, data: MmbSetup.Data, dhs: DoubleHelix[]) {
        const errors = new Array<string>();
        const duplicates = findDuplicates(dhs);

        const cOne = data.compounds.find(c => c.chain.name === dh.chainNameA);
        const cTwo = data.compounds.find(c => c.chain.name === dh.chainNameB);

        if (!cOne)
            errors.push(`Chain ${dh.chainNameA} does not exist`);
        if (!cTwo)
            errors.push(`Chain ${dh.chainNameB} does not exist`);
        if (!cOne || !cTwo)
            return errors;

        if (dh.firstResNoA > dh.lastResNoA)
            errors.push('Last residue on the first chain must be greater or equal than first residue');
        if (dh.firstResNoB < dh.lastResNoB)
            errors.push('First residue on the second chain must be greater or equal than last residue');
        if (dh.lastResNoA > cOne.lastResidue.number)
            errors.push('Last residue number on the first chain is past the end of the chain');
        if (dh.firstResNoA < cOne.firstResidue.number)
            errors.push('First residue number on the first chain is ahead of the beginning of the chain');
        if (dh.firstResNoB > cTwo.lastResidue.number)
            errors.push('First residue number on the second chain is past the end of the chain');
        if (dh.lastResNoB < cTwo.firstResidue.number)
            errors.push('Last residue number on the second chain is ahead of the beginning of the chain');
        if (errors.length > 0)
            return errors;

        for (const dh2 of data.doubleHelices) {
            if (dh2.overlaps(dh))
                errors.push(`Double helix ${dh2.toString()} overlaps with double helix ${dh.toString()}`);
        }

        for (const d of duplicates)
            errors.push(`Double helix ${d.toString()} is already present`);

        return errors.length > 0 ? errors : void 0;
    }

    private validateGlobal(g: GlobalConfig, _data: MmbSetup.Data) {
        const errors = new Array<string>();

        if (g.baseInteractionScaleFactor < 0)
            errors.push('Base interaction scale factor must be non-negative');
        if (g.temperature <= 0)
            errors.push('Temperature must be positive');

        return errors.length > 0 ? errors : void 0;
    }

    private validateMobilizer(m: Mobilizer, data: MmbSetup.Data, ms: Mobilizer[]) {
        if (m.chainName) {
            const c = data.compounds.find(c => c.chain.name === m.chainName);
            if (!c)
                return [`Chain ${m.chainName} does not exist`];

            if (m.residueSpan && m.residueSpan.last < m.residueSpan.first)
                return ['Last residue must be greater or equal to the first residue'];
        }

        if (data.mobilizers[0] && data.mobilizers[0].chainName === undefined)
            return ['Cannot add mobilizer for a part of the structure when there is a global mobilizer already set'];
        if (data.mobilizers.length > 0 && m.chainName === undefined)
            return ['Cannot add mobilizer for the entire structure when there are some other mobilizers already set'];

        for (const om of data.mobilizers) {
            if (om.chainName === m.chainName) {
                if (!m.residueSpan)
                    return [`Cannot add mobilizer for the entire chain when there are some other mobilizers already set for chain ${om.chainName}`];
                if (!om.residueSpan === undefined)
                    return [`Cannot add mobilizer for chain ${om.chainName} when there is a mobilizer for the entire chain already set for that chain`];

                if (m.overlaps(om))
                    return ['Mobilizer overlaps another already existing mobilizer'];
            }
        }

        const duplicates = findDuplicates(ms);
        if (duplicates.length > 0) {
            const errors = new Array<string>();
            for (const d of duplicates)
                errors.push(`Mobilizer ${d.toString()} is already present`);
            return errors;
        }

        return undefined;
    }

    private validateNtC(conformation: NtC.Conformation, data: MmbSetup.Data, conformations: NtC.Conformation[]) {
        const errors = new Array<string>();

        const c = data.compounds.find(c => c.chain.name === conformation.chainName);
        if (!c) {
            errors.push(`Chain ${conformation.chainName} does not exist`);
            return errors;
        }

        if (conformation.firstResNo < c.firstResidue.number || conformation.firstResNo > c.lastResidue.number)
            errors.push('First residue number is invalid');
        if (conformation.lastResNo < c.firstResidue.number || conformation.lastResNo > c.lastResidue.number)
            errors.push('Last residue number is invalid');
        if (conformation.lastResNo <= conformation.firstResNo)
            errors.push('Last residue must be greater than first residue');

        const duplicates = findDuplicates(conformations);
        for (const d of duplicates)
            errors.push(d.toString());

        return errors.length > 0 ? errors : void 0;
    }

    private validateReporting(reporting: Reporting, _data: MmbSetup.Data) {
        const errors = new Array<string>();

        if (reporting.interval <= 0)
            errors.push('Length of the reporting interval must be positive');
        if (reporting.count <= 0 || Math.floor(reporting.count) !== reporting.count)
            errors.push('Number of reporting intervals must be a positive integer');

        return errors.length > 0 ? errors : void 0;
    }

    private validateStage(stage: number, data: MmbSetup.Data) {
        if (stage < 0)
            return ['Stage number must be positive'];

        return void 0;
    }

    private validateStages(stages: StagesSpan, _data: MmbSetup.Data) {
        const errors = new Array<string>();

        if (stages.first < 0)
            errors.push('First stage number must be greater than zero');
        if (stages.last < stages.first)
            errors.push('Last stage number must be greater of equal to first stage number');

        return errors.length > 0 ? errors : void 0;
    }

    get additionalFiles() {
        return copyArray<AdditionalFile>(this.data.additionalFiles);
    }

    get advancedParameters() {
        return this.data.advancedParameters.clone();
    }

    get baseInteractions() {
        return copyArray<BaseInteraction>(this.data.baseInteractions);
    }

    get compounds() {
        return copyArray<Compound>(this.data.compounds);
    }

    get densityFitFiles() {
        return this.data.densityFitFiles.clone();
    }

    get doubleHelices() {
        return copyArray<DoubleHelix>(this.data.doubleHelices);
    }

    get global() {
        return this.data.global.clone();
    }

    get md() {
        return this.data.md.clone();
    }

    get mobilizers() {
        return copyArray<Mobilizer>(this.data.mobilizers);
    }

    get ntcs() {
        return copyArray<NtC.Conformation>(this.data.ntcs);
    }

    get ntcForceScaleFactor() {
        return this.data.ntcForceScaleFactor;
    }

    get reporting() {
        return this.data.reporting.clone();
    }

    get stage() {
        return this.data.stage;
    }

    get stages() {
        return this.data.stages.clone();
    }

    /**
     * Adds an item to an array.
     *
     * If the item is successfully added this function automatically
     * notifies all relevant subscribers.
     *
     * @param k Id of the array to add data to
     * @param toAdd Item to add
     *
     * @returns List of errors if the item is invalid, undefined otherwise
     */
    add<K extends keyof VectorData>(k: K, toAdd: Dearray<VectorData[K]>) {
        const provisional = copyArray<typeof toAdd>(this.data[k] as typeof toAdd[]);
        provisional.push(toAdd);
        const errors = (this.vectorValidators[k] as VectorValidationFunc<typeof toAdd>)(toAdd, this.data, provisional);
        if (errors)
            return errors;

        (this.data[k] as typeof toAdd[]).push(toAdd);
        this.postAdd(k);
    }

    /**
     * Destroys the object.
     *
     * This function must be called to clean up subscriptions properly.
     */
    destroy() {
        this.ek.destroy();
    }

    /**
     * Notifies all subscribers
     */
    reannounce() {
        for (const k in this.events)
            this.notify(k as keyof Events, false);
        this.anything.next();
    }

    /**
     * Removes an item from an array.
     *
     * This function automatically notifies relevant subscribers when the item is removed.
     *
     * If the passed item is not in the array, the array is not altered but the
     * subscribers are still notified.
     *
     * @param k Id of the arrray to remove data from
     * @param toRemove Item to remove
     */
    remove<K extends keyof VectorData>(k: K, toRemove: Dearray<VectorData[K]>) {
        (this.data[k] as typeof toRemove[]) = (this.data[k] as typeof toRemove[]).filter(x => toRemove.equals(x as any));
        this.postRemove(k);
    }

    /**
     * Removes an item at a given index from an array.
     *
     * This function automatically notifies all relevant subscribers when the item is removed.
     *
     * @param k Id of the list to remove data from
     * @param idx Index of the item to remove
     *
     * @throws Error When the index is invalid
     */
    removeAt<K extends keyof VectorData>(k: K, idx: number) {
        if (idx < 0 || idx >= this.data[k].length)
            throw new Error(`Index ${idx} into array ${k} is invalid`);

        this.data[k].splice(idx, 1);
        this.postRemove(k);
    }

    /**
     * Removes multiple items from an array.
     *
     * This function automatically notifies relevant subscribers when the item is removed.
     *
     * If the passed array of items to be removed is empty or none of the items to be removed
     * is present in the array that is being removed from, the array is not altered but the
     * subscribers are still notified.
     *
     * @param k Id of the array to remove data from
     * @param toRemove List of items to remove
     */
    removeMany<K extends keyof VectorData>(k: K, toRemove: VectorData[K]) {
        if (toRemove.length === 0) {
            this.postRemove(k);
            return;
        }

        const f = toRemove[0];
        (this.data[k] as typeof f[]) = (this.data[k] as typeof f[]).filter((x: any) => {
            for (const r of toRemove) {
                if (x.equals(r))
                    return false;
            }
            return true;
        });
    }

    /**
     * Sets new data for the entire model.
     *
     * @param data Data to set
     * @param reannounce If true, notifies all subscribers when new model data is set
     *
     * @returns Array of errors when the new data is invalid, undefined otherwise
     */
    reset(data: MmbSetup.Data, reannounce = true) {
        const allErrors = new Array<string>();
        const fresh = MmbSetup.emptyData();

        let prop: keyof typeof data;
        for (prop in data) {
            const v = data[prop];
            (fresh[prop] as typeof v) = v;
        }

        for (prop in data) {
            if (isVectorDataKey(prop)) {
                const v = data[prop];
                for (const item of v) {
                    const errors = (this.vectorValidators[prop] as VectorValidationFunc<typeof item>)(item, fresh, v);
                    if (errors)
                        allErrors.push(...errors);
                }
            } else {
                const v = data[prop];
                const errors = (this.scalarValidators[prop] as ScalarValidationFunc<typeof v>)(v, fresh);
                if (errors)
                    allErrors.push(...errors);
            }
        }

        if (allErrors.length > 0)
            return allErrors;

        this.data = fresh;
        if (reannounce)
            this.reannounce();
    }

    set<K extends keyof ScalarData>(k: K, v: ScalarData[K], force = false) {
        const errors = this.scalarValidators[k](v as any, this.data); // TODO: Why the eff do I need this?
        if (errors)
            return errors;

        if (!force) {
            const old = this.data[k];
            if (typeof v === 'number') {
                if (v === old) return;
            } else {
                if (v.equals(old as any)) return;
            }
        }
        (this.data[k] as typeof v) = v;
        this.notify(k);
    }

    update<K extends keyof VectorData>(k: K, updated: Dearray<VectorData[K]>, force = false) {
        const idx = getIndex(updated, this.data[k] as typeof updated[]);
        if (idx === -1)
            throw new Error('No such element');

        const provisional = copyArray(this.data[k] as typeof updated[]);
        provisional[idx] = updated;
        const errors = (this.vectorValidators[k] as VectorValidationFunc<typeof updated>)(updated, this.data, provisional);
        if (errors)
            return errors;

        if (!force) {
            const old = this.data[k][idx];
            if (updated.equals(old as any))
                return;
        }
        this.data[k][idx] = updated;
        this.notify(k);
    }

    updateAt<K extends keyof VectorData>(k: K, idx: number, updated: Dearray<VectorData[K]>, force = false) {
        if (this.data[k][idx] === undefined)
            throw new Error('Invalid index');

        const provisional = copyArray(this.data[k] as typeof updated[]);
        provisional[idx] = updated;
        const errors = (this.vectorValidators[k] as VectorValidationFunc<typeof updated>)(updated, this.data, provisional);
        if (errors)
            return errors;

        if (!force) {
            const old = this.data[k][idx];
            if (updated.equals(old as any))
                return;
        }
        this.data[k][idx] = updated;
        this.notify(k);
    }

    static emptyData(): MmbSetup.Data {
        return {
            additionalFiles: [],
            advancedParameters: new AdvancedParameters.Type(),
            baseInteractions: [],
            compounds: [],
            densityFitFiles: new DensityFitFiles(null, null),
            doubleHelices: [],
            global: GlobalConfig.default(),
            md: new MdParameters(false),
            mobilizers: [],
            ntcs: [],
            ntcForceScaleFactor: 0,
            reporting: new Reporting(0, 0),
            stage: 0,
            stages: new StagesSpan(0, 0),
        };
    }
}
