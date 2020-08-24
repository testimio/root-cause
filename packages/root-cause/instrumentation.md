Next tasks:
- [x] Code review Elad’s repo and make pull requests porting interesting stuff there.
- [x] Elad to open pull request in screenplay repo
- [x] Port screenplay repo to React (with create-react-app please and tsconfig with strict:true :])
- [ ] Port screenplay repo to use “new architecture”:
- [ ] Split screenshot code to hooks (PuppeteerScreenshotProvider)
- [ ] Split reporting to TestContext and make TestContext split step contexts before each step.
- [ ] Write API facade wrapper

Questions:
* Who is in charge of uploading assets?
* Every step (with a guid) with the association being done by *
* returning the guid on the return value of the hook.
* What should the retention of results be?
Look at what cypress for example is doing

Reporting:
* Takes a StepContext[] and does something with it?

Data Representation:
The TestContext is logically the owner of one or more StepContexts which are ordered and represent the execution of a single logical action in the automation framework:
StepContext[] (or iterable)
- Name.
- Description.
- Error if any (if the step threw an error)
- Screenshot.
- startTime (when the before hook ran)
- endTime (when the after hook ran)
- Selector to highlight, rectangle (like in codeless)
- Can add additional properties here for whatever data.

Architecture and data in screenplay:
API (facade) - just exposes a screenplay object with `attach` to the user.
This may allow attaching or delegating.
API for "starting" and "ending" a test explicitly (library API)
API for instrumenting into jest eventually.
TestContext (in charge of managing result state) - this gets created once per Screenplay and it sets the new StepContext whenever hooks are run for a new step (by registering hooks).
In before the action - create the new StepContext
In after the action - dump the state from the StepContext to an array.
Test context and lifetime is determined explicitly initially (library API) or implicitly with a framework API (jest).
Write to a file/somewhere.
- Instrumentors (**PuppeteerInstrumentor**/PlaywrightInstrumentor/SeleniumInstrumentor)
- HookProviders (**PuppeteerScreenshotProvider**/SeleniumConsoleLogsProvider)
All these hook providers need to be able to dumb data to the “result”, we probably want an analogy PlaybackContext or StepResult.


Hooks are in order (that is, if I define a hook first - I will always be called first and last on the test).

//  - Instrumentation Hooks

```ts
interface AutomationFrameworkHooks<T> {
  // this is implemented for screenshots/console logs etc
  before(fnName: string, context: any, rootContext: any, arguments: any[]): Promise <Partial<StepContext>?>
  after(fnName: string, context: any, rootContext: any, arguments: any[], returnValue: any, error?: Error): Promise <Result?>
};

interface AutomationFrameworkHooks<T> {
  // this is implemented for screenshots/console logs etc
  before(fnName: string, context: any, rootContext: any, arguments: any[]): Promise <Result?>
  after(fnName: string, context: any, rootContext: any, arguments: any[], returnValue: any, error?: Error): Promise <void>
};

interface AutomationFrameworkInstrumentor {
  // register additional hooks on a context, this is implemented for 
  // puppeteer/selenium
  registerHooks(hooks: AutomationFrameworkHooks);
};
```


//  - Architecture in general

//  - Data structure for screenplay maybe
//  - Converting to React 
