/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Parameter as P } from '../model/parameter';

function options<T, K extends keyof T>(o: T): K[] {
    return Object.keys(o) as K[];
}

const BondMobility = { 'Free': null, 'Torsion': null, 'Rigid': null };
export type BondMobility = keyof typeof BondMobility;

const Integrators = { 'RungeKuttaMerson': null, 'Verlet': null };
export type Integrators = keyof typeof Integrators;

const PotentialTypes = { 'HarmonicInverse': null, 'HarmonicInverseLorentzian': null };
export type PotentialTypes = keyof typeof PotentialTypes;

const ThermostatTypes = { 'NoseHoover': null };
export type ThermostatTypes = keyof typeof ThermostatTypes;

export type ParameterNames = 'addAllAtomSterics' | 'addAllHeavyAtomSterics' | 'addProteinBackboneSterics' |
    'addRNABackboneSterics' | 'addSelectedAtoms' | 'alignmentForcesIsGapped' |
    'alignmentForcesGapPenalty' | 'alignmentForcesDeadLengthFraction' | 'alignmentForcesForceConstant' |
    'applyC1pSprings' | 'calcEnergy' | 'constrainRigidSegments' | 'constraintTolerance' |
    'cutoffRadius' | 'densityAtomFraction' | 'densityFileName' | 'densityFileName' |
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
    ['addAllAtomSterics', new P.BooleanParameter<ParameterNames>('addAllAtomSterics', '') as P.Parameter<ParameterNames>],
    ['addAllHeavyAtomSterics', new P.BooleanParameter<ParameterNames>('addAllHeavyAtomSterics', '')],
    ['addProteinBackboneSterics', new P.BooleanParameter<ParameterNames>('addProteinBackboneSterics', '')],
    ['addRNABackboneSterics', new P.BooleanParameter<ParameterNames>('addRNABackboneSterics', '')],
    ['addSelectedAtoms', new P.BooleanParameter<ParameterNames>('addSelectedAtoms', 'Add steric spheres to certain RNA atoms as specified in the RNABuilder parameter file')],
    // new MP.BooleanParameter('useCIFFileFormat', ''), Keep this disabled for now
    ['alignmentForcesIsGapped', new P.BooleanParameter<ParameterNames>('alignmentForcesIsGapped', 'Add steric spheres to certain RNA atoms as specified in the RNABuilder parameter file')],
    ['alignmentForcesGapPenalty', new P.RealParameter<ParameterNames>('alignmentForcesGapPenalty', 'The penalty applied to gaps. The noGaps condition is enforced with a high value of this parameter. Can vary through the course of the input commands file. This is only the final value')],
    ['alignmentForcesDeadLengthFraction', new P.RealParameter<ParameterNames>('alignmentForcesDeadLengthFraction', 'The fraction of the initial length to which the alignmentSprings equilibrate. Should be in the interval (0,1]. A nonzero value enables e.g. progressive morphing.  Can vary through the course of the input commands file. This is only the final value', P.EZeroIOneRange)],
    ['alignmentForcesForceConstant', new P.RealParameter<ParameterNames>('alignmentForcesForceConstant', 'Force constant for the alignmentForces springs. Can vary through the course of the input commands file. This is only the final value')],
    ['applyC1pSprings', new P.BooleanParameter<ParameterNames>('applyC1pSprings', '')],
    ['calcEnergy', new P.BooleanParameter<ParameterNames>('calcEnergy', '')],
    ['constrainRigidSegments', new P.BooleanParameter<ParameterNames>('constrainRigidSegments', '')],
    ['constraintTolerance', new P.RealParameter<ParameterNames>('constraintTolerance', '')],
    ['cutoffRadius', new P.RealParameter<ParameterNames>('cutoffRadius', '(nm)', new P.Range(new P.Min(0.1, 'inclusive')))],
    ['densityAtomFraction', new P.RealParameter<ParameterNames>('densityAtomFraction', '', P.EZeroEOneRange)],
    ['densityFileName', new P.TextualParameter<ParameterNames>('densityFileName', '')],
    ['densityFitPhosphates', new P.BooleanParameter<ParameterNames>('densityFitPhosphates', 'When set to False, this means phosphate groups in DNA and RNA will feel zero density map fitting force. Be warned that this slows down your run A LOT -- proportional to the number of nucleic acid residues that have fitting forces turned on')],
    ['densityForceConstant', new P.RealParameter<ParameterNames>('densityForceConstant', '')],
    ['densityNoiseComputeAutocorrelation', new P.RealParameter<ParameterNames>('densityNoiseComputeAutocorrelation', 'Compute the autocorrelation function for both the planck\'s law noise and input density. may only have effect if densityNoiseScale > 0', P.PositiveRange)],
    ['densityReportAtEachAtomPosition', new P.BooleanParameter<ParameterNames>('densityReportAtEachAtomPosition', 'Write out the local density observed at each atom position, and the corresponding atom name. Written to stdout. Only works when the density forces are active')],
    ['densityNoiseTemperature', new P.RealParameter<ParameterNames>('densityNoiseTemperature', 'Temperature for the Planck\'s Law based noise generator for the density map', P.PositiveRange)],
    ['densityNoiseScale', new P.RealParameter<ParameterNames>('densityNoiseScale', 'Overall scale of the noise for the Planck\'s Law based noise generator for the density map. Note that this scales the noise amplitude, but the amplitude is squared prior to being added to the density map, and being used to compute signalToNoiseRatio')],
    ['dutyCycle', new P.RealParameter<ParameterNames>('dutyCycle', '', P.EZeroEOneRange)],
    ['electroDensityFileName', new P.TextualParameter<ParameterNames>('electroDensityFileName', '')],
    ['electroDensityForceConstant', new P.RealParameter<ParameterNames>('electroDensityForceConstant', '')],
    ['excludedVolumeRadius', new P.RealParameter<ParameterNames>('excludedVolumeRadius', 'Radius (in nm) of contact spheres to be applied in AllHeavyAtomSterics and AllAtomSterics', P.PositiveRange)],
    ['excludedVolumeStiffness', new P.RealParameter(<ParameterNames>'excludedVolumeStiffness', '')],
    // new MP.IntegralParameter<ParameterNames>('firstStage', '', MP.PositiveRange), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['fitDefaultTolerance', new P.RealParameter<ParameterNames>('fitDefaultTolerance', '')],
    // new MP.RealParameter('baseInteractionScaleFactor', ''), NOTE. This is set explicitly elsewhere
    ['globalAmberImproperTorsionScaleFactor', new P.RealParameter<ParameterNames>('globalAmberImproperTorsionScaleFactor', '')],
    ['globalBondBendScaleFactor', new P.RealParameter<ParameterNames>('globalBondBendScaleFactor', '')],
    ['globalBondStretchScaleFactor', new P.RealParameter<ParameterNames>('globalBondStretchScaleFactor', '')],
    ['globalBondTorsionScaleFactor', new P.RealParameter<ParameterNames>('globalBondTorsionScaleFactor', '')],
    ['globalCoulombScaleFactor', new P.RealParameter<ParameterNames>('globalCoulombScaleFactor', '')],
    ['globalGbsaScaleFactor', new P.RealParameter<ParameterNames>('globalGbsaScaleFactor', '')],
    ['globalVdwScaleFactor', new P.RealParameter<ParameterNames>('globalVdwScaleFactor', '')],
    ['guessCoordinates', new P.BooleanParameter<ParameterNames>('guessCoordinates', 'If true, invents coordinates for any atoms missing from the input PDB file')],
    ['inQVectorFileName', new P.TextualParameter<ParameterNames>('inQVectorFileName', '')],
    ['initialSeparation', new P.RealParameter<ParameterNames>('initialSeparation', '')],
    ['integratorAccuracy', new P.RealParameter<ParameterNames>('integratorAccuracy', '', P.PositiveRange)],
    ['integratorStepSize', new P.RealParameter<ParameterNames>('integratorStepSize', '', P.PositiveRange)],
    ['integratorType', new P.OptionsParameter<ParameterNames, Integrators>('integratorType', '', options(Integrators))],
    // new MP.IntegralParameter('lastStage', '', MP.PositiveRange), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['leontisWesthofInFileName', new P.TextualParameter<ParameterNames>('leontisWesthofInFileName', '')],
    ['loadTinkerParameterFile', new P.BooleanParameter<ParameterNames>('loadTinkerParameterFile', '')],
    ['outQVectorFileName', new P.TextualParameter<ParameterNames>('outQVectorFileName', '')],
    ['magnesiumIonChainId', new P.TextualParameter<ParameterNames>('magnesiumIonChainId', '')],
    ['magnesiumIonRadius', new P.RealParameter<ParameterNames>('magnesiumIonRadius', '', P.PositiveRange)],
    ['matchHydrogenAtomLocations', new P.BooleanParameter<ParameterNames>('matchHydrogenAtomLocations', 'If false, do not read the hydrogen atom positions from the input pdb file.  Just guess new atom locations.  This is useful if the hydrogens are in bad (e.g. colinear) locations')],
    ['matchExact', new P.BooleanParameter<ParameterNames>('matchExact', 'If True, this matches all bond lengths, angles, and dihedrals to the 2-, 3-, and 4- neighbor atom sets. Locally the match will be nearly perfect, but over a long biopolymer error can accumulate')],
    ['matchIdealized', new P.BooleanParameter<ParameterNames>('matchIdealized', 'If True, the bond lengths and angles will be set to default (idealized) values and the torsion angles will be iteratively adjusted to match the input structure.  Thus the global structure is likely to be good, but small-scale details will differ from those of the input structure.  This is much more expensive than matchExact')],
    ['matchOptimize', new P.BooleanParameter<ParameterNames>('matchOptimize', 'If True, this matches all bond lengths, angles, and dihedrals to the 2-, 3-, and 4- neighbor atom sets. Locally the match will be nearly perfect, but over a long biopolymer error can accumulate')],
    ['minimize', new P.BooleanParameter<ParameterNames>('minimize', '')],
    ['monteCarloTemperature', new P.RealParameter<ParameterNames>('monteCarloTemperature', '')],
    ['monteCarloTemperatureIncrement', new P.RealParameter<ParameterNames>('monteCarloTemperatureIncrement', '')],
    ['nastGlobalBondTorsionScaleFactor', new P.IntegralParameter<ParameterNames>('nastGlobalBondTorsionScaleFactor', '')],
    ['noseHooverTime', new P.RealParameter<ParameterNames>('noseHooverTime', '')],
    // nw MP.IntegralParameter<ParameterNames>('numReportingIntervals', ''), NOTE: This is set elsewhere, allowing to manually override this would break stuff
    ['outMonteCarloFileName', new P.TextualParameter<ParameterNames>('outMonteCarloFileName', '')],
    ['outTrajectoryFileName', new P.TextualParameter<ParameterNames>('outTrajectoryFileName', '')],
    ['physicsRadius', new P.RealParameter<ParameterNames>('physicsRadius', 'All residues within physicsRadius of \"flexible\" atoms are included in the physics zone. \"flexible\" is defined as belonging to a body of mass < 40')],
    ['planarityThreshold', new P.RealParameter<ParameterNames>('planarityThreshold', '')],
    ['potentialType', new P.OptionsParameter<ParameterNames, PotentialTypes>('potentialType', '', options(PotentialTypes))],
    ['prioritize', new P.IntegralParameter<ParameterNames>('prioritize', '', P.IZeroIOneRange)], // NOTE: This is obviously a boolean but MMB expects an integer here
    ['proteinCapping', new P.BooleanParameter<ParameterNames>('proteinCapping', 'When true, adds terminal capping groups to protein chains')],
    ['useNACappingHydroxyls', new P.BooleanParameter<ParameterNames>('useNACappingHydroxyls', 'When true (default) replaces the 5\' phosphorus with an H5T')],
    ['randomizeInitialVelocities', new P.BooleanParameter<ParameterNames>('randomizeInitialVelocities', 'When true, adds a stochastic velocity to each body at the beginning of the stage')],
    ['readPreviousFrameFile', new P.BooleanParameter<ParameterNames>('readPreviousFrameFile', '')],
    ['readMagnesiumPositionsFromFile', new P.BooleanParameter<ParameterNames>('readMagnesiumPositionsFromFile', '')],
    ['removeMomentumPeriod', new P.RealParameter<ParameterNames>('removeMomentumPeriod', '', P.PositiveRange)],
    ['removeRigidBodyMomentum', new P.BooleanParameter<ParameterNames>('removeRigidBodyMomentum', '')],
    // new MP.RealParameter<ParameterNames>('reportingInterval', 'This command sets the simulation time per reporting interval, in ps. Total simulation time = reportingInterval * numReportingIntervals', MP.PositiveRange), NOTE: This is set elsewhere
    ['restrainingForceConstant', new P.RealParameter<ParameterNames>('restrainingForceConstant', '')],
    ['restrainingTorqueConstant', new P.RealParameter<ParameterNames>('restrainingTorqueConstant', '')],
    ['scrubberPeriod', new P.RealParameter<ParameterNames>('scrubberPeriod', '')],
    // new MP.BooleanParamete<ParameterNames>r('safeParameters', ''), NOTE: If enabled, MMB forgoes some sanity check of input parameters. Allowing this would raise a brand new level of hell I am not ready to deal with
    ['setChiBondMobility', new P.BooleanParameter<ParameterNames>('setChiBondMobility', '')],
    // setDefaultMDParameters -> This is a metaparameter that sets a bunch of other parameters to some predefined values. I recommend to not handle this as an actual parameter
    ['setForceAndStericScrubber', new P.BooleanParameter<ParameterNames>('setForceAndStericScrubber', '')],
    ['setForceScrubber', new P.BooleanParameter<ParameterNames>('setForceScrubber', '')],
    ['setHelicalStacking', new P.BooleanParameter<ParameterNames>('setHelicalStacking', '')],
    ['setRemoveBasePairsInRigidStretch', new P.BooleanParameter<ParameterNames>('setRemoveBasePairsInRigidStretch', '')],
    ['setTemperature', new P.BooleanParameter<ParameterNames>('setTemperature', '')],
    ['smallGroupInertiaMultiplier', new P.RealParameter<ParameterNames>('smallGroupInertiaMultiplier', '')],
    ['sphericalHelix center', new P.TextualParameter<ParameterNames>('sphericalHelix center', '', (v: string) => v.split(' ').length === 3)],
    ['sphericalHelix radius', new P.RealParameter<ParameterNames>('sphericalHelix radius', '')],
    ['sphericalHelix startTheta', new P.RealParameter<ParameterNames>('sphericalHelix startTheta', '')],
    ['sphericalHelix phiOffset', new P.RealParameter<ParameterNames>('sphericalHelix phiOffset', '')],
    ['sphericalHelix interStrandDistance', new P.RealParameter<ParameterNames>('sphericalHelix interStrandDistance', '')],
    ['stackAllHelicalResidues', new P.BooleanParameter<ParameterNames>('stackAllHelicalResidues', '')],
    ['thermostatType', new P.OptionsParameter<ParameterNames, ThermostatTypes>('thermostatType', '', options(ThermostatTypes))],
    ['tinkerParameterFileName', new P.TextualParameter<ParameterNames>('tinkerParameterFileName', '')],
    ['useFixedStepSize', new P.BooleanParameter<ParameterNames>('useFixedStepSize', '')],
    ['useOpenMMAcceleration', new P.BooleanParameter<ParameterNames>('useOpenMMAcceleration', '')],
    ['vanderWallSphereRadius', new P.RealParameter<ParameterNames>('vanderWallSphereRadius', '')],
    ['velocityRescalingInterval', new P.RealParameter<ParameterNames>('velocityRescalingInterval', '', P.PositiveRange)],
    ['verbose', new P.BooleanParameter<ParameterNames>('verbose', '')],
    ['vmdOutput', new P.IntegralParameter<ParameterNames>('vmdOutput', '', P.IZeroIOneRange)], // NOTE: This is very likely a on/off toggle but MMB expects integral value
    ['waterDropletMake', new P.BooleanParameter<ParameterNames>('waterDropletMake', '')],
    ['waterInertiaMultiplier', new P.RealParameter<ParameterNames>('waterInertiaMultiplier', '')],
    ['writeCoordinates', new P.BooleanParameter<ParameterNames>('writeCoordinates', '')],
    ['writeDoublePrecisionTrajectories', new P.BooleanParameter<ParameterNames>('writeDoublePrecisionTrajectories', '')],
    // new MP:TextualParameter<ParameterNames>('workingDirectory', ''), NOTE: Allowing this to be changed in a client-server system will break everything
    ['helixBondMobility', new P.OptionsParameter<ParameterNames, BondMobility>('helixBondMobility', '', options(BondMobility))],
    ['loopBondMobility', new P.OptionsParameter<ParameterNames, BondMobility>('loopBondMobility', '', options(BondMobility))],
    ['overallBondMobility', new P.OptionsParameter<ParameterNames, BondMobility>('overallBondMobility', '', options(BondMobility))],
    ['chiBondMobility', new P.OptionsParameter<ParameterNames, BondMobility>('chiBondMobility', '', options(BondMobility))],
]);
