/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Parameter as P } from '../model/mmb/parameter';

function options<T, K extends keyof T>(o: T): K[] {
    return Object.keys(o) as K[];
}

const BondMobility = { 'Free': null, 'Torsion': null, 'Rigid': null };
export type BondMobility = keyof typeof BondMobility;

const Integrators = { 'RungeKuttaMerson': null, 'Verlet': null };
export type Integrators = keyof typeof Integrators;

const PotentialTypes = { 'HarmonicInverse': null, 'HarmonicInverseLorentzian': null };
export type PotentialTypes = keyof typeof PotentialTypes;

export const ThermostatTypes = { 'NoseHoover': null };
export type ThermostatTypes = keyof typeof ThermostatTypes;

export type ParameterNames = 'addAllAtomSterics' | 'addAllHeavyAtomSterics' | 'addProteinBackboneSterics' |
    'addRNABackboneSterics' | 'addSelectedAtoms' | 'alignmentForcesIsGapped' |
    'alignmentForcesGapPenalty' | 'alignmentForcesDeadLengthFraction' | 'alignmentForcesForceConstant' |
    'applyC1pSprings' | 'calcEnergy' | 'constrainRigidSegments' | 'constraintTolerance' |
    'cutoffRadius' | 'densityAtomFraction' | 'densityFileName' |
    'densityFitPhosphates' | 'densityForceConstant' | 'densityNoiseComputeAutocorrelation' |
    'densityReportAtEachAtomPosition' | 'densityNoiseTemperature' | 'densityNoiseScale' |
    'densityMapActivate' | 'dutyCycle' | 'electroDensityFileName' | 'electroDensityForceConstant' |
    'excludedVolumeRadius' | 'excludedVolumeStiffness' | 'firstResidueMobilizerType' |
    'fitDefaultTolerance' | 'baseInteractionScaleFactor' | 'globalAmberImproperTorsionScaleFactor' |
    'globalBondBendScaleFactor' | 'globalBondStretchScaleFactor' | 'globalBondTorsionScaleFactor' |
    'globalCoulombScaleFactor' | 'globalGbsaScaleFactor' | 'globalVdwScaleFactor' |
    'guessCoordinates' | 'inQVectorFileName' | 'initialSeparation' |
    'integratorAccuracy' | 'integratorStepSize' | 'integratorType' |
    'leontisWesthofInFileName' | 'loadTinkerParameterFile' | 'outQVectorFileName' |
    'magnesiumIonChainId' | 'magnesiumIonRadius' | 'matchHydrogenAtomLocations' |
    'matchProteinCarboxylOxygenLocations' | 'matchingMinimizerTolerance' | 'matchExact' |
    'matchIdealized' | 'matchOptimize' | 'matchPerfect' |
    'minimize' | 'monteCarloTemperature' | 'monteCarloTemperatureIncrement' |
    'nastGlobalBondTorsionScaleFactor' | 'noseHooverTime' | 'outMonteCarloFileName' |
    'outTrajectoryFileName' | 'physicsRadius' | 'planarityThreshold' |
    'potentialType' | 'prioritize' | 'proteinCapping' |
    'useNACappingHydroxyls' | 'randomizeInitialVelocities' | 'readPreviousFrameFile' |
    'readMagnesiumPositionsFromFile' | 'removeMomentumPeriod' | 'removeRigidBodyMomentum' |
    'restrainingForceConstant' | 'restrainingTorqueConstant' | 'rigidifyFormedHelices' |
    'scrubberPeriod' | 'setChiBondMobility' | 'setForceAndStericScrubber' |
    'setForceScrubber' | 'setHelicalStacking' | 'setRemoveBasePairsInRigidStretch' |
    'setTemperature' | 'smallGroupInertiaMultiplier' | 'sphericalHelix center' |
    'sphericalHelix radius' | 'sphericalHelix startTheta' | 'sphericalHelix phiOffset' |
    'sphericalHelix interStrandDistance' | 'stackAllHelicalResidues' |
    'thermostatType' | 'tinkerParameterFileName' | 'useFixedStepSize' |
    'useOpenMMAcceleration' | 'vanderWallSphereRadius' |
    'velocityRescalingInterval' | 'verbose' | 'vmdOutput' |
    'waterDropletMake' | 'waterInertiaMultiplier' | 'writeCoordinates' |
    'writeDoublePrecisionTrajectories' | 'helixBondMobility' | 'loopBondMobility' |
    'overallBondMobility' | 'chiBondMobility';

export const Parameters: ReadonlyMap<ParameterNames, P.Parameter<ParameterNames>> = new Map([
    ['addAllAtomSterics', new P.StaticParameter('addAllAtomSterics', '', new P.BooleanArgument()) as P.Parameter<ParameterNames>],
    ['addAllHeavyAtomSterics', new P.StaticParameter('addAllHeavyAtomSterics', '', new P.BooleanArgument())],
    ['addProteinBackboneSterics', new P.StaticParameter('addProteinBackboneSterics', '', new P.BooleanArgument())],
    ['addRNABackboneSterics', new P.StaticParameter('addRNABackboneSterics', '', new P.BooleanArgument())],
    ['addSelectedAtoms', new P.StaticParameter('addSelectedAtoms', 'Add steric spheres to certain RNA atoms as specified in the RNABuilder parameter file', new P.BooleanArgument())],
    // new MP.BooleanParameter('useCIFFileFormat', ''), Keep this disabled for now
    ['alignmentForcesIsGapped', new P.StaticParameter('alignmentForcesIsGapped', 'Add steric spheres to certain RNA atoms as specified in the RNABuilder parameter file', new P.BooleanArgument())],
    ['alignmentForcesGapPenalty', new P.StaticParameter('alignmentForcesGapPenalty', 'The penalty applied to gaps. The noGaps condition is enforced with a high value of this parameter. Can vary through the course of the input commands file. This is only the final value', new P.RealArgument())],
    ['alignmentForcesDeadLengthFraction', new P.StaticParameter('alignmentForcesDeadLengthFraction', 'The fraction of the initial length to which the alignmentSprings equilibrate. Should be in the interval (0,1]. A nonzero value enables e.g. progressive morphing.  Can vary through the course of the input commands file. This is only the final value', new P.RealArgument(P.EZeroIOneRange))],
    ['alignmentForcesForceConstant', new P.StaticParameter('alignmentForcesForceConstant', 'Force constant for the alignmentForces springs. Can vary through the course of the input commands file. This is only the final value', new P.RealArgument())],
    ['applyC1pSprings', new P.StaticParameter('applyC1pSprings', '', new P.BooleanArgument())],
    ['calcEnergy', new P.StaticParameter('calcEnergy', '', new P.BooleanArgument())],
    ['constrainRigidSegments', new P.StaticParameter('constrainRigidSegments', '', new P.BooleanArgument())],
    ['constraintTolerance', new P.StaticParameter('constraintTolerance', '', new P.RealArgument())],
    ['cutoffRadius', new P.StaticParameter('cutoffRadius', '(nm)', new P.RealArgument(new P.Range(new P.Min(0.1, 'inclusive'))))],
    ['densityAtomFraction', new P.StaticParameter('densityAtomFraction', '', new P.RealArgument(P.EZeroEOneRange))],
    //['densityFileName', new P.FileParameter<ParameterNames>('densityFileName', '', [])],
    ['densityFileName', new P.OptionsDynamicParameter('densityFileName', '')],
    ['densityFitPhosphates', new P.StaticParameter('densityFitPhosphates', 'When set to False, this means phosphate groups in DNA and RNA will feel zero density map fitting force. Be warned that this slows down your run A LOT -- proportional to the number of nucleic acid residues that have fitting forces turned on', new P.BooleanArgument())],
    ['densityForceConstant', new P.StaticParameter('densityForceConstant', '', new P.RealArgument())],
    ['densityNoiseComputeAutocorrelation', new P.StaticParameter('densityNoiseComputeAutocorrelation', 'Compute the autocorrelation function for both the planck\'s law noise and input density. may only have effect if densityNoiseScale > 0', new P.RealArgument(P.PositiveRange))],
    ['densityReportAtEachAtomPosition', new P.StaticParameter('densityReportAtEachAtomPosition', 'Write out the local density observed at each atom position, and the corresponding atom name. Written to stdout. Only works when the density forces are active', new P.BooleanArgument())],
    ['densityNoiseTemperature', new P.StaticParameter('densityNoiseTemperature', 'Temperature for the Planck\'s Law based noise generator for the density map', new P.RealArgument(P.PositiveRange))],
    ['densityNoiseScale', new P.StaticParameter('densityNoiseScale', 'Overall scale of the noise for the Planck\'s Law based noise generator for the density map. Note that this scales the noise amplitude, but the amplitude is squared prior to being added to the density map, and being used to compute signalToNoiseRatio', new P.RealArgument())],
    ['dutyCycle', new P.StaticParameter('dutyCycle', '', new P.RealArgument(P.EZeroEOneRange))],
    ['electroDensityFileName', new P.OptionsDynamicParameter('electroDensityFileName', '')],
    ['electroDensityForceConstant', new P.StaticParameter('electroDensityForceConstant', '', new P.RealArgument())],
    ['excludedVolumeRadius', new P.StaticParameter('excludedVolumeRadius', 'Radius (in nm) of contact spheres to be applied in AllHeavyAtomSterics and AllAtomSterics', new P.RealArgument(P.PositiveRange))],
    ['excludedVolumeStiffness', new P.StaticParameter('excludedVolumeStiffness', '', new P.RealArgument())],
    // new MP.IntegralParameter<ParameterNames>('firstStage', '', MP.PositiveRange), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['fitDefaultTolerance', new P.StaticParameter('fitDefaultTolerance', '', new P.RealArgument())],
    // new MP.RealParameter('baseInteractionScaleFactor', ''), NOTE. This is set explicitly elsewhere
    ['globalAmberImproperTorsionScaleFactor', new P.StaticParameter('globalAmberImproperTorsionScaleFactor', '', new P.RealArgument())],
    ['globalBondBendScaleFactor', new P.StaticParameter('globalBondBendScaleFactor', '', new P.RealArgument())],
    ['globalBondStretchScaleFactor', new P.StaticParameter('globalBondStretchScaleFactor', '', new P.RealArgument())],
    ['globalBondTorsionScaleFactor', new P.StaticParameter('globalBondTorsionScaleFactor', '', new P.RealArgument())],
    ['globalCoulombScaleFactor', new P.StaticParameter('globalCoulombScaleFactor', '', new P.RealArgument())],
    ['globalGbsaScaleFactor', new P.StaticParameter('globalGbsaScaleFactor', '', new P.RealArgument())],
    ['globalVdwScaleFactor', new P.StaticParameter('globalVdwScaleFactor', '', new P.RealArgument())],
    ['guessCoordinates', new P.StaticParameter('guessCoordinates', 'If true, invents coordinates for any atoms missing from the input PDB file', new P.BooleanArgument())],
    ['inQVectorFileName', new P.OptionsDynamicParameter('inQVectorFileName', '')],
    ['initialSeparation', new P.StaticParameter('initialSeparation', '', new P.RealArgument())],
    ['integratorAccuracy', new P.StaticParameter('integratorAccuracy', '', new P.RealArgument(P.PositiveRange, 0.0001))],
    ['integratorStepSize', new P.StaticParameter('integratorStepSize', '', new P.RealArgument(P.PositiveRange))],
    ['integratorType', new P.StaticParameter('integratorType', '', new P.OptionsArgument(options(Integrators)))],
    // new MP.IntegralParameter('lastStage', '', MP.PositiveRange), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['leontisWesthofInFileName', new P.OptionsDynamicParameter('leontisWesthofInFileName', '')],
    ['loadTinkerParameterFile', new P.StaticParameter('loadTinkerParameterFile', '', new P.BooleanArgument())],
    ['outQVectorFileName', new P.StaticParameter('outQVectorFileName', '', new P.TextualArgument())],
    ['magnesiumIonChainId', new P.StaticParameter('magnesiumIonChainId', '', new P.TextualArgument())],
    ['magnesiumIonRadius', new P.StaticParameter('magnesiumIonRadius', '', new P.RealArgument(P.PositiveRange))],
    ['matchHydrogenAtomLocations', new P.StaticParameter('matchHydrogenAtomLocations', 'If false, do not read the hydrogen atom positions from the input pdb file.  Just guess new atom locations.  This is useful if the hydrogens are in bad (e.g. colinear) locations', new P.BooleanArgument())],
    ['matchExact', new P.StaticParameter('matchExact', 'If True, this matches all bond lengths, angles, and dihedrals to the 2-, 3-, and 4- neighbor atom sets. Locally the match will be nearly perfect, but over a long biopolymer error can accumulate', new P.BooleanArgument())],
    ['matchIdealized', new P.StaticParameter('matchIdealized', 'If True, the bond lengths and angles will be set to default (idealized) values and the torsion angles will be iteratively adjusted to match the input structure.  Thus the global structure is likely to be good, but small-scale details will differ from those of the input structure.  This is much more expensive than matchExact', new P.BooleanArgument())],
    ['matchOptimize', new P.StaticParameter('matchOptimize', 'If True, this matches all bond lengths, angles, and dihedrals to the 2-, 3-, and 4- neighbor atom sets. Locally the match will be nearly perfect, but over a long biopolymer error can accumulate', new P.BooleanArgument())],
    ['minimize', new P.StaticParameter('minimize', '', new P.BooleanArgument())],
    ['monteCarloTemperature', new P.StaticParameter('monteCarloTemperature', '', new P.RealArgument())],
    ['monteCarloTemperatureIncrement', new P.StaticParameter('monteCarloTemperatureIncrement', '', new P.RealArgument())],
    ['nastGlobalBondTorsionScaleFactor', new P.StaticParameter('nastGlobalBondTorsionScaleFactor', '', new P.IntegralArgument())],
    ['noseHooverTime', new P.StaticParameter('noseHooverTime', '', new P.RealArgument())],
    // nw MP.IntegralParameter<ParameterNames>('numReportingIntervals', ''), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['outMonteCarloFileName', new P.StaticParameter('outMonteCarloFileName', '', new P.TextualArgument())],
    ['outTrajectoryFileName', new P.StaticParameter('outTrajectoryFileName', '', new P.TextualArgument())],
    ['physicsRadius', new P.StaticParameter('physicsRadius', 'All residues within physicsRadius of "flexible" atoms are included in the physics zone. "flexible" is defined as belonging to a body of mass < 40', new P.RealArgument())],
    ['planarityThreshold', new P.StaticParameter('planarityThreshold', '', new P.RealArgument())],
    ['potentialType', new P.StaticParameter('potentialType', '', new P.OptionsArgument(options(PotentialTypes)))],
    ['prioritize', new P.StaticParameter('prioritize', '', new P.IntegralArgument(P.IZeroIOneRange))], // NOTE: This is obviously a boolean but MMB expects an integer here
    ['proteinCapping', new P.StaticParameter('proteinCapping', 'When true, adds terminal capping groups to protein chains', new P.BooleanArgument())],
    ['useNACappingHydroxyls', new P.StaticParameter('useNACappingHydroxyls', 'When true (default) replaces the 5\' phosphorus with an H5T', new P.BooleanArgument())],
    ['randomizeInitialVelocities', new P.StaticParameter('randomizeInitialVelocities', 'When true, adds a stochastic velocity to each body at the beginning of the stage', new P.BooleanArgument())],
    ['readPreviousFrameFile', new P.StaticParameter('readPreviousFrameFile', '', new P.BooleanArgument())],
    ['readMagnesiumPositionsFromFile', new P.StaticParameter('readMagnesiumPositionsFromFile', '', new P.BooleanArgument())],
    ['removeMomentumPeriod', new P.StaticParameter('removeMomentumPeriod', '', new P.RealArgument(P.PositiveRange))],
    ['removeRigidBodyMomentum', new P.StaticParameter('removeRigidBodyMomentum', '', new P.BooleanArgument())],
    // new MP.RealParameter<ParameterNames>('reportingInterval', 'This command sets the simulation time per reporting interval, in ps. Total simulation time = reportingInterval * numReportingIntervals', MP.PositiveRange), NOTE: This is set elsewhere
    ['restrainingForceConstant', new P.StaticParameter('restrainingForceConstant', '', new P.RealArgument())],
    ['restrainingTorqueConstant', new P.StaticParameter('restrainingTorqueConstant', '', new P.RealArgument())],
    ['scrubberPeriod', new P.StaticParameter('scrubberPeriod', '', new P.RealArgument())],
    // new MP.BooleanParamete<ParameterNames>r('safeParameters', ''), NOTE: If enabled, MMB forgoes some sanity check of input parameters. Allowing this would raise a brand new level of hell I am not ready to deal with
    ['setChiBondMobility', new P.StaticParameter('setChiBondMobility', '', new P.RealArgument())],
    // setDefaultMDParameters -> This is a metaparameter that sets a bunch of other parameters to some predefined values. I recommend to not handle this as an actual parameter
    ['setForceAndStericScrubber', new P.StaticParameter('setForceAndStericScrubber', '', new P.BooleanArgument())],
    ['setForceScrubber', new P.StaticParameter('setForceScrubber', '', new P.BooleanArgument())],
    ['setHelicalStacking', new P.StaticParameter('setHelicalStacking', '', new P.BooleanArgument())],
    ['setRemoveBasePairsInRigidStretch', new P.StaticParameter('setRemoveBasePairsInRigidStretch', '', new P.BooleanArgument())],
    ['setTemperature', new P.StaticParameter('setTemperature', '', new P.BooleanArgument())],
    ['smallGroupInertiaMultiplier', new P.StaticParameter('smallGroupInertiaMultiplier', '', new P.RealArgument())],
    ['sphericalHelix center', new P.StaticParameter('sphericalHelix center', '', new P.TextualArgument((v: string) => v.split(' ').length === 3))],
    ['sphericalHelix radius', new P.StaticParameter('sphericalHelix radius', '', new P.RealArgument())],
    ['sphericalHelix startTheta', new P.StaticParameter('sphericalHelix startTheta', '', new P.RealArgument())],
    ['sphericalHelix phiOffset', new P.StaticParameter('sphericalHelix phiOffset', '', new P.RealArgument())],
    ['sphericalHelix interStrandDistance', new P.StaticParameter('sphericalHelix interStrandDistance', '', new P.RealArgument())],
    ['stackAllHelicalResidues', new P.StaticParameter<ParameterNames>('stackAllHelicalResidues', '', new P.BooleanArgument())],
    ['thermostatType', new P.StaticParameter('thermostatType', '', new P.OptionsArgument(options(ThermostatTypes)))],
    ['tinkerParameterFileName', new P.OptionsDynamicParameter('tinkerParameterFileName', '')],
    ['useFixedStepSize', new P.StaticParameter('useFixedStepSize', '', new P.BooleanArgument())],
    ['useOpenMMAcceleration', new P.StaticParameter('useOpenMMAcceleration', '', new P.BooleanArgument())],
    ['vanderWallSphereRadius', new P.StaticParameter('vanderWallSphereRadius', '', new P.BooleanArgument())],
    ['velocityRescalingInterval', new P.StaticParameter('velocityRescalingInterval', '', new P.RealArgument(P.PositiveRange))],
    ['verbose', new P.StaticParameter('verbose', '', new P.BooleanArgument())],
    ['vmdOutput', new P.StaticParameter('vmdOutput', '', new P.IntegralArgument(P.IZeroIOneRange))], // NOTE: This is very likely a on/off toggle but MMB expects integral value
    ['waterDropletMake', new P.StaticParameter('waterDropletMake', '', new P.BooleanArgument())],
    ['waterInertiaMultiplier', new P.StaticParameter('waterInertiaMultiplier', '', new P.RealArgument())],
    ['writeCoordinates', new P.StaticParameter('writeCoordinates', '', new P.BooleanArgument())],
    ['writeDoublePrecisionTrajectories', new P.StaticParameter('writeDoublePrecisionTrajectories', '', new P.BooleanArgument())],
    // new MP:TextualParameter<ParameterNames>('workingDirectory', ''), NOTE: Allowing this to be changed in a client-server system will break everything
    ['helixBondMobility', new P.StaticParameter('helixBondMobility', '', new P.OptionsArgument(options(BondMobility)))],
    ['loopBondMobility', new P.StaticParameter('loopBondMobility', '', new P.OptionsArgument(options(BondMobility)))],
    ['overallBondMobility', new P.StaticParameter('overallBondMobility', '', new P.OptionsArgument(options(BondMobility)))],
    ['chiBondMobility', new P.StaticParameter('chiBondMobility', '', new P.OptionsArgument(options(BondMobility)))],
]);

export const FileInputParameterNames: ParameterNames[] = [
    'densityFileName', 'electroDensityFileName', 'inQVectorFileName',
    'leontisWesthofInFileName', 'tinkerParameterFileName',
];
