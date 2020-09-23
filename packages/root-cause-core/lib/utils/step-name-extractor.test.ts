import { extractStepName } from './step-name-extractor';
import { strictEqual } from 'assert';
import type { StepResult } from '@testim/root-cause-types';

const result = (part: Partial<StepResult>) => Object.assign({ index: 1, startTimestamp: Date.now() }, part);

describe("Figuring out a step's name", () => {
  it('Uses the selector and action name', () => {
    strictEqual(extractStepName(result({ fnName: 'click', selector: '.myClass' })), 'click ".myClass"');
    strictEqual(extractStepName(result({ fnName: 'dblclick', selector: '.myClass' })), 'dblclick ".myClass"');
    strictEqual(extractStepName(result({ fnName: 'dblclick', selector: '#myId' })), 'dblclick "#myId"');
    strictEqual(extractStepName(result({ fnName: 'select', selector: '#myId' })), 'select "#myId"');
    strictEqual(extractStepName(result({ fnName: 'tap', selector: '#myId' })), 'tap "#myId"');
    strictEqual(extractStepName(result({ fnName: 'waitForSelector', selector: '#myId' })), 'waitForSelector "#myId"');
  });

  it('Uses the step text when there is step text', () => {
    strictEqual(
      extractStepName(result({ fnName: 'goto', text: 'http://www.example.com' })),
      'goto "http://www.example.com"'
    );
    strictEqual(
      extractStepName(result({ fnName: 'type', text: 'loacker', selector: '#ilan' })),
      'type "loacker" on "#ilan"'
    );
  });

  it('Deals gracefully with missing data in case the user messes with things', () => {
    strictEqual(extractStepName(result({})), 'Run Command');
  });
});
