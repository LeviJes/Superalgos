﻿exports.newSuperalgosBotModulesSingleMarketTradingBot = function (processIndex) {

    const MODULE_NAME = "Trading Bot";
    
    let session = TS.projects.superalgos.botModules.tradingSession.newSuperalgosBotModulesTradingSession(processIndex)
    let nextLoopTimeoutHandle;

    let thisObject = {
        initialize: initialize,
        run: run
    };

    let processConfig;

    return thisObject;

    function initialize(pProcessConfig, callBackFunction) {
        /*  This function is exactly the same in the 3 modules representing the 2 different bot types loops. */
        try {
            processConfig = pProcessConfig;
            if (TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.config.repo === undefined) {
                /* The code of the bot is defined at the UI. No need to load a file with the code. */
                session.initialize(processConfig, callBackFunction)
            }

        } catch (err) {
            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_INSTANCE_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] initialize -> err = " + err.stack);
            callBackFunction(TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    function run(callBackFunction) {
        try {
            /* Some initial values*/
            TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).IS_SESSION_STOPPING = true;
            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_INSTANCE_LOGGER_MODULE.write(MODULE_NAME, '[IMPORTANT] run -> Stopping the Session now. ')

            loop();

            function loop() {
                try {
                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Running...")
                    function pad(str, max) {
                        str = str.toString();
                        return str.length < max ? pad(" " + str, max) : str;
                    }

                    /* For each loop we want to create a new log file. */
                    if (TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE !== undefined) {
                        TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.finalize()
                    }
                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE = TS.projects.superalgos.taskModules.debugLog.newSuperalgosTaskModulesDebugLog(processIndex)
                    TS.projects.superalgos.globals.taskVariables.LOGGER_MAP.set(MODULE_NAME + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].id, TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE)

                    TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).MAIN_LOOP_COUNTER++;

                    let nextWaitTime;

                    /* We tell the UI that we are running. */
                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Running...")

                    /* We define the datetime for the process that we are running now. This will be the official processing time for both the infraestructure and the bot. */
                    TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_DATETIME = new Date();           // This will be considered the process date and time, so as to have it consistenly all over the execution.

                    /* Main Loop Console Logging */
                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.newMainLoop()

                    /* Checking if we need to need to emit any event */
                    if (TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS === 'Idle' && TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).IS_SESSION_STOPPING === false) {
                        TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS = 'Running'
                    }

                    if (TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS === 'Running' && TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).IS_SESSION_STOPPING === true) {
                        TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS = 'Stopped'
                    }

                    TS.projects.superalgos.functionLibraries.sessionFunctions.emitSessionStatus(TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS, TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY)

                    /* Checking if we should process this loop or not.*/
                    if (TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).IS_SESSION_STOPPING === true) {

                        TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> Waiting for " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.type + " " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.name + " to be run.")

                        console.log(new Date().toISOString() + " " + pad(TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.parentNode.config.codeName, 20) + " " + pad(TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.config.codeName, 30)
                            + " Waiting for " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.type + " " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.name + " to be run. ");

                        nextWaitTime = 'Waiting for Session';
                        loopControl(nextWaitTime);
                        return
                    }

                    /* We will prepare first the infraestructure needed for the bot to run. There are 3 modules we need to sucessfullly initialize first. */

                    let processExecutionEvents
                    let userBot;
                    let processFramework;
                    let statusDependencies;
                    let dataDependencies;

                    initializeProcessExecutionEvents();

                    function initializeProcessExecutionEvents() {
                        try {
                            processExecutionEvents = TS.projects.superalgos.processModules.processExecutionEvents.newSuperalgosProcessModulesProcessExecutionEvents(processIndex)
                            processExecutionEvents.initialize(processConfig, onInizialized);

                            function onInizialized(err) {
                                try {
                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> Execution finished well.");
                                            startProcessExecutionEvents()
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeProcessExecutionEvents -> onInizialized -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeProcessExecutionEvents -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function startProcessExecutionEvents() {
                        try {
                            processExecutionEvents.start(onStarted);

                            function onStarted(err) {
                                try {
                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> startProcessExecutionEvents -> onStarted -> Execution finished well.");

                                            if (TS.projects.superalgos.globals.taskVariables.IS_TASK_STOPPING === true) {
                                                loopControl()
                                                return
                                            }

                                            initializeStatusDependencies();
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> startProcessExecutionEvents -> onStarted -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessExecutionEvents -> onStarted -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessExecutionEvents -> onStarted -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessExecutionEvents -> onStarted -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessExecutionEvents -> onStarted -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessExecutionEvents -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function initializeStatusDependencies() {
                        try {
                            statusDependencies = TS.projects.superalgos.processModules.statusDependencies.newSuperalgosProcessModulesStatusDependencies(processIndex);
                            statusDependencies.initialize(onInizialized);

                            function onInizialized(err) {
                                try {
                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> initializeStatusDependencies -> onInizialized -> Execution finished well.");
                                            initializeDataDependencies();
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> initializeStatusDependencies -> onInizialized -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeStatusDependencies -> onInizialized -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeStatusDependencies -> onInizialized -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeStatusDependencies -> onInizialized -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeStatusDependencies -> onInizialized -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeStatusDependencies -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function initializeDataDependencies() {
                        try {
                            dataDependencies = TS.projects.superalgos.processModules.dataDependencies.newSuperalgosProcessModulesDataDependencies(processIndex);
                            dataDependencies.initialize(onInizialized);

                            function onInizialized(err) {
                                try {
                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> initializeDataDependencies -> onInizialized -> Execution finished well.")
                                            switch (processConfig.framework.name) {
                                                case 'Low-Frequency-Trading-Process': {
                                                    processFramework = TS.projects.superalgos.botModules.tradingProcess.newSuperalgosBotModulesTradingProcess(processIndex);
                                                    intitializeProcessFramework();
                                                    break;
                                                }
                                                default: {
                                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> onInizialized -> Process Framework not Supported.");
                                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> onInizialized -> Process Framework Name = " + processConfig.framework.name);
                                                    global.unexpectedError = err.message
                                                    processStopped()
                                                    return
                                                }
                                            }
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> initializeDataDependencies -> onInizialized -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> onInizialized -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> onInizialized -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> onInizialized -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies ->  onInizialized -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> initializeDataDependencies -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function intitializeProcessFramework() {
                        try {
                            processFramework.initialize(processConfig, statusDependencies, dataDependencies, onInizialized);

                            function onInizialized(err) {
                                try {
                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> intitializeProcessFramework -> onInizialized -> Execution finished well.");
                                            startProcessFramework();
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> intitializeProcessFramework -> onInizialized -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework -> onInizialized -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.CUSTOM_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework -> onInizialized > Unhandled custom response received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework -> onInizialized -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework -> onInizialized -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework ->  onInizialized -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> intitializeProcessFramework -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function startProcessFramework() {
                        try {
                            processFramework.start(onFinished);

                            function onFinished(err) {
                                try {
                                    processFramework.finalize()
                                    processFramework = undefined
                                    dataDependencies.finalize()
                                    dataDependencies = undefined
                                    statusDependencies.finalize()
                                    statusDependencies = undefined

                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> startProcessFramework -> onFinished -> Execution finished well.");
                                            nextWaitTime = 'Normal';
                                            finishProcessExecutionEvents()
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> startProcessFramework -> onFinished -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> onFinished -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.CUSTOM_OK_RESPONSE.result: {

                                            switch (err.message) {
                                                case "Dependency does not exist.": {
                                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> startProcessFramework -> onFinished -> Dependency does not exist. This Loop will go to sleep.");
                                                    nextWaitTime = 'Sleep';
                                                    loopControl(nextWaitTime);
                                                    return;
                                                }
                                                case "Dependency not ready.": {
                                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> startProcessFramework -> onFinished -> Dependency not ready. This Loop will go to sleep.");
                                                    nextWaitTime = 'Sleep';
                                                    loopControl(nextWaitTime);
                                                    return;
                                                }
                                                default: {
                                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> onFinished -> Unhandled custom response received. -> err = " + err.message);
                                                    global.unexpectedError = err.message
                                                    processStopped()
                                                    return
                                                }
                                            }
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> onFinished -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> onFinished -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> onFinished -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> startProcessFramework -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function finishProcessExecutionEvents() {
                        try {
                            processExecutionEvents.finish(onFinished);

                            function onFinished(err) {
                                try {
                                    processExecutionEvents.finalize()
                                    processExecutionEvents = undefined

                                    switch (err.result) {
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE.result: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> finishProcessExecutionEvents -> onFinished -> Execution finished well.");
                                            nextWaitTime = 'Normal';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_RETRY_RESPONSE.result: {  // Something bad happened, but if we retry in a while it might go through the next time.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[WARN] run -> loop -> finishProcessExecutionEvents -> onFinished -> Retry Later. Requesting Execution Retry.");
                                            nextWaitTime = 'Retry';
                                            loopControl(nextWaitTime);
                                            return;
                                        }
                                        case TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE.result: { // This is an unexpected exception that we do not know how to handle.
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> finishProcessExecutionEvents -> onFinished -> Operation Failed. Aborting the process.");
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                        default: {
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> finishProcessExecutionEvents -> onFinished -> Unhandled err.result received. -> err.result = " + err.result);
                                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> finishProcessExecutionEvents -> onFinished -> Unhandled err.result received. -> err = " + err.message);
                                            global.unexpectedError = err.message
                                            processStopped()
                                            return
                                        }
                                    }
                                } catch (err) {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> finishProcessExecutionEvents -> onFinished -> err = " + err.stack);
                                    global.unexpectedError = err.message
                                    processStopped()
                                    return
                                }
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> finishProcessExecutionEvents -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                    function loopControl(nextWaitTime) {
                        TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> nextWaitTime = " + nextWaitTime)

                        /* We show we reached the end of the loop. */
                        TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Running...")

                        /* Here we check if we must stop the loop gracefully. */
                        shallWeStop(onStop, onContinue);

                        function onStop() {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> onStop -> Stopping the Loop Gracefully. See you next time!")
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();

                            TS.projects.superalgos.globals.taskConstants.EVENT_SERVER_CLIENT_INSTANCE.raiseEvent(TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY, 'Stopped')
                            processStopped()
                            return;
                        }

                        function onContinue() {
                            /* Indicator bots are going to be executed after a configured period of time after the last execution ended. This is to avoid overlapping executions. */
                            switch (nextWaitTime) {
                                case 'Waiting for Session': {
                                    let waitTime = processConfig.sessionRunWaitTime
                                    nextLoopTimeoutHandle = setTimeout(loop, waitTime);
                                    let waitingTime = waitTime / 1000 / 60
                                    let label = 'minute/s'
                                    if (waitingTime < 1) {
                                        waitingTime = waitTime / 1000
                                        label = 'seconds'
                                    }
                                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Waiting " + waitingTime + " " + label + " for " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.type + " " + TS.projects.superalgos.globals.taskConstants.TASK_NODE.bot.processes[processIndex].session.name + " to be run. ")
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                                }
                                    break
                                case 'Normal': {
                                    let waitTime
                                    if (processConfig.waitsForExecutionFinishedEvent === true) {
                                        waitTime = 0
                                    } else {
                                        switch (TS.projects.superalgos.globals.processConstants.CONSTANTS_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_NODE.type) {
                                            case 'Live Trading Session': {
                                                waitTime = TS.projects.superalgos.globals.processConstants.CONSTANTS_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_NODE.tradingParameters.timeFrame.config.value
                                                break
                                            }
                                            case 'Fordward Tessting Session': {
                                                waitTime = TS.projects.superalgos.globals.processConstants.CONSTANTS_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_NODE.tradingParameters.timeFrame.config.value
                                                break
                                            }
                                            case 'Paper Trading Session': {
                                                waitTime = TS.projects.superalgos.globals.processConstants.CONSTANTS_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_NODE.tradingParameters.timeFrame.config.value
                                                break
                                            }
                                            case 'Backtesting Session': {
                                                waitTime = 0
                                                break
                                            }
                                        }
                                    }

                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> Restarting Loop in " + (waitTime / 1000 / 60) + " minute/s.")
                                    nextLoopTimeoutHandle = setTimeout(loop, waitTime);
                                    let waitingTime = waitTime / 1000 / 60
                                    let label = 'minute/s'
                                    if (waitingTime < 1) {
                                        waitingTime = waitTime / 1000
                                        label = 'seconds'
                                    }
                                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Waiting " + waitingTime + " " + label + " for next execution.")
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                                }
                                    break;
                                case 'Retry': {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> Restarting Loop in " + (processConfig.retryWaitTime / 1000) + " seconds.")
                                    nextLoopTimeoutHandle = setTimeout(loop, processConfig.retryWaitTime);
                                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Trying to recover from some problem. Waiting " + processConfig.retryWaitTime / 1000 + " seconds for next execution.")
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                                }
                                    break;
                                case 'Sleep': {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> Restarting Loop in " + (processConfig.sleepWaitTime / 60000) + " minutes.")
                                    nextLoopTimeoutHandle = setTimeout(loop, processConfig.sleepWaitTime);
                                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Waiting " + processConfig.sleepWaitTime / 60000 + " minutes for next execution.")
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                                }
                                    break;
                                case 'Coma': {
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[INFO] run -> loop -> loopControl -> Restarting Loop in " + (processConfig.comaWaitTime / 3600000) + " hours.")
                                    nextLoopTimeoutHandle = setTimeout(loop, processConfig.comaWaitTime);
                                    TS.projects.superalgos.functionLibraries.processFunctions.processHeartBeat(processIndex, undefined, undefined, "Waiting " + processConfig.comaWaitTime / 3600000 + " hours for next execution.")
                                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                                }
                                    break;
                            }
                        }
                    }

                    function shallWeStop(stopCallBack, continueCallBack) {
                        try {
                            /* IMPORTANT: This function is exactly the same on the 3 modules. */
                            if (!TS.projects.superalgos.globals.taskVariables.IS_TASK_STOPPING) {
                                continueCallBack();
                            } else {
                                stopCallBack();
                            }
                        } catch (err) {
                            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> shallWeStop -> err = " + err.stack);
                            global.unexpectedError = err.message
                            processStopped()
                            return
                        }
                    }

                } catch (err) {
                    TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_INSTANCE_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> loop -> err = " + err.stack);
                    global.unexpectedError = err.message
                    processStopped()
                    return
                }
            }

            function processStopped() {
                if (global.unexpectedError !== undefined) {
                    TS.projects.superalgos.functionLibraries.processFunctions.processError(TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_KEY, undefined, "An unexpected error caused the Process to stop.")
                } else {
                    TS.projects.superalgos.globals.taskConstants.EVENT_SERVER_CLIENT_INSTANCE.raiseEvent(TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_KEY, 'Stopped')
                }
                sessionStopped()
                TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE.persist();
                clearTimeout(nextLoopTimeoutHandle);
                if (global.unexpectedError !== undefined) {
                    callBackFunction(TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
                } else {
                    callBackFunction(TS.projects.superalgos.globals.standardResponses.DEFAULT_OK_RESPONSE)
                }
            }

            function sessionStopped() {
                if (TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS === 'Running') {
                    TS.projects.superalgos.globals.taskConstants.EVENT_SERVER_CLIENT_INSTANCE.raiseEvent(TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY, 'Stopped')
                    TS.projects.superalgos.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_STATUS = 'Stopped'
                }
            }

        } catch (err) {
            TS.projects.superalgos.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).PROCESS_INSTANCE_LOGGER_MODULE.write(MODULE_NAME, "[ERROR] run -> err = " + err.stack);
            clearTimeout(nextLoopTimeoutHandle);
            callBackFunction(TS.projects.superalgos.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }
};
