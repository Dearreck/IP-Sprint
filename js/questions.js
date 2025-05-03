// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// CORREGIDO: Error 'Assignment to constant variable' en generateIdentifyIpTypeQuestion.
// MODIFICADO: generateSpecialAddressQuestion para incluir IPs Privadas/Públicas como objetivo.
// MODIFICADO: generateClassAndNetworkPortionQuestion para añadir tabla de clases y resaltar Dir. Red en explicación.
// MODIFICADO: generateIdentifyHostPortionQuestion para añadir tabla de clases, rango utilizable y usar combinaciones de octetos como opciones.
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask,
    generateRandomSubnetMask, generateWildcardExplanationHTML,
    getMaskPrefixLength, calculateUsableHosts, calculateNumberOfSubnets, generateSubnettingExplanationHTML,
    formatNumber,
    getFirstUsableHost, getLastUsableHost, generateIpTypeExplanationHTML,
    generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    prefixToMaskString, generateMaskForHostsExplanationHTML
} from './utils.js';

import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Nivel Entry) ---
function generateClassQuestion() {
    try {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'N/A') return generateClassQuestion(); // Retry if invalid class generated
        const question = { key: 'question_given_ip_what_class', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['A', 'B', 'C', 'D', 'E'];
        const correct = info.class;
        const explanationInfo = { generatorName: 'generateClassRangeTableHTML', args: [correct] };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null;
    }
}

function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        let forcePrivate = Math.random() < 0.4; // Increase chance of private IP
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        // Avoid unknown, loopback, apipa, limited broadcast for this specific question type
        while ((info.typeKey === 'unknown' || info.typeKey === 'loopback' || info.typeKey === 'apipa' || info.typeKey === 'limited_broadcast') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        // Fallback if generation fails
        if (info.typeKey !== 'public' && info.typeKey !== 'private') {
            ip = '8.8.8.8'; // Google DNS (Public)
            info = getIpInfo(ip);
        }
        const question = { key: 'question_given_ip_what_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['option_public', 'option_private']; // Only these two options
        const correct = `option_${info.typeKey}`;
        const explanationInfo = { generatorName: 'generatePrivateRangeTableHTML', args: [ip] };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateTypeQuestion:", error);
        return null;
    }
}

function generateDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Ensure we get a class A, B, or C IP that isn't loopback
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.typeKey === 'loopback') && attempts < 100);
        // Fallback if generation fails
        if (attempts >= 100) {
            ip = '192.168.1.1'; // Class C
            info = getIpInfo(ip);
        }
        const question = { key: 'question_given_ip_what_mask', replacements: { ip: `<strong>${ip}</strong>`, class: info.class } };
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const correct = info.defaultMask;
        const explanationInfo = { generatorName: 'generateClassRangeTableHTML', args: [info.class] };
        // Ensure the correct answer is actually one of the options provided
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateDefaultMaskQuestion:", error);
        return null;
    }
}

function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = { key: 'question_select_ip_for_class', replacements: { targetClass: `<strong>${targetClass}</strong>` } };
        let correctIp = '';
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set(); // To avoid duplicate IPs in options

        // Find a correct IP for the target class
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            if (info.class === targetClass && info.typeKey !== 'loopback') {
                correctIp = ip;
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback if generation fails
        if (!correctIp) {
            if(targetClass === 'A') correctIp = '10.1.1.1';
            else if(targetClass === 'B') correctIp = '172.16.1.1';
            else correctIp = '192.168.1.1';
            ipSet.add(correctIp);
        }

        // Find incorrect IPs (different class)
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Ensure incorrect IP has a valid class, isn't loopback, and isn't already selected
            if (info.class !== targetClass && info.class !== 'N/A' && info.typeKey !== 'loopback' && !ipSet.has(ip)) {
                incorrectIps.push(ip);
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback for incorrect IPs if needed
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) {
                    incorrectIps.push(fb);
                    ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Ensure only 3 incorrect options

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const explanationInfo = {
            baseTextKey: 'explanation_select_ip_for_class',
            replacements: { targetClass: targetClass, correctIp: correct },
            generatorName: 'generateClassRangeTableHTML',
            args: [targetClass] // Highlight the target class in the explanation table
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectClassQuestion:", error);
        return null;
    }
}

function generateSelectPrivateIpQuestion() {
    try {
        const question = { key: 'question_select_private_ip' };
        let correctIp = generateRandomPrivateIp(); // Generate a correct private IP
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set([correctIp]); // Start with the correct IP

        // Find incorrect IPs (public)
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Ensure incorrect IP is public and not already selected
            if (info.typeKey === 'public' && !ipSet.has(ip)) {
                incorrectIps.push(ip);
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback for incorrect IPs if needed
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1'];
            for (const fb of fallbacks) {
                if (incorrectIps.length < 3 && !ipSet.has(fb)) {
                    incorrectIps.push(fb);
                    ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Ensure only 3 incorrect options

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const explanationInfo = { generatorName: 'generatePrivateRangeTableHTML', args: [correct] }; // Show RFC1918 table
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectPrivateIpQuestion:", error);
        return null;
    }
}

function generateSelectIpByDefaultMaskQuestion() {
    try {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = { key: 'question_select_ip_for_mask', replacements: { targetMask: `<strong>${targetMask}</strong>` } };
        let correctIp = '';
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set();

        // Find a correct IP for the target mask's class
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            if (info.defaultMask === targetMask && info.typeKey !== 'loopback') {
                correctIp = ip;
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback if generation fails
        if (!correctIp) {
            if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; // Class A
            else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; // Class B
            else correctIp = '192.168.1.1'; // Class C
            ipSet.add(correctIp);
        }

        // Find incorrect IPs (different default mask)
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Ensure incorrect IP has a default mask, it's different from target, isn't loopback, and isn't already selected
            if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.typeKey !== 'loopback' && !ipSet.has(ip)) {
                incorrectIps.push(ip);
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback for incorrect IPs if needed
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                let fbInfo = getIpInfo(fb);
                if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') {
                    incorrectIps.push(fb);
                    ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Ensure only 3 incorrect options

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const correctClass = getIpInfo(correct).class;
        const explanationInfo = {
            baseTextKey: 'explanation_select_ip_for_mask',
            replacements: { class: correctClass, mask: targetMask },
            generatorName: 'generateClassRangeTableHTML',
            args: [correctClass] // Highlight the correct class in the explanation
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectIpByDefaultMaskQuestion:", error);
        return null;
    }
}

// --- Generadores de Preguntas (Nivel Associate) ---

function generateClassAndTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        // Get a valid A, B, or C IP
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.typeKey === 'loopback') && attempts < 100);
        if (attempts >= 100) { // Fallback
             ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; info = getIpInfo(ip);
        }

        const question = { key: 'question_given_ip_what_class_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class;
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, typeKey: `option_${info.typeKey}` };
        let options = [];
        options.push(correctAnswerObject);

        // Generate incorrect options by varying class or type
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());
        const possibleTypeKeys = ['option_public', 'option_private'].filter(k => k !== correctAnswerObject.typeKey);

        // Option: Correct Class, Incorrect Type
        if (possibleTypeKeys.length > 0) {
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, typeKey: possibleTypeKeys[0] });
        }
        // Option: Incorrect Class, Correct Type
        if (possibleClassesLower.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, typeKey: correctAnswerObject.typeKey });
        }
        // Option: Incorrect Class, Incorrect Type
        if (possibleClassesLower.length > 0 && possibleTypeKeys.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, typeKey: possibleTypeKeys[0] });
        }

        // Ensure 4 options, avoid duplicates
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.typeKey}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`;
            const randomTypeKey = ['option_public', 'option_private'][getRandomInt(0, 1)];
            const potentialOption = { classKey: randomClassKey, typeKey: randomTypeKey };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.typeKey}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4);
        shuffleArray(options);

        // Combine explanations for class and type
        const explanationInfo = {
            generators: [
                { generatorName: 'generateClassRangeTableHTML', args: [correctClass] },
                { generatorName: 'generatePrivateRangeTableHTML', args: [ip] }
            ],
            separator: '<hr style="margin: 10px 0;">' // Visual separator
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndTypeQuestion:", error);
        return null;
    }
}

function generateClassAndDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Get a valid A, B, or C IP
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.typeKey === 'loopback') && attempts < 100);
        if (attempts >= 100) { // Fallback
             ip = '172.16.50.50'; info = getIpInfo(ip);
        }

        const question = { key: 'question_given_ip_what_class_mask', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class;
        const correctMask = info.defaultMask;
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, maskValue: correctMask };
        let options = [];
        options.push(correctAnswerObject);

        // Generate incorrect options by varying class or mask
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);

        // Option: Correct Class, Incorrect Mask
        if (possibleMasks.length > 0) {
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, maskValue: possibleMasks[0] });
        }
        // Option: Incorrect Class, Correct Mask
        if (possibleClassesLower.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, maskValue: correctMask });
        }
        // Option: Incorrect Class, Incorrect Mask (try to pick a plausible mask for the incorrect class)
        if (possibleClassesLower.length > 0) {
            let incorrectMaskForIncorrectClass = '255.255.255.255'; // Default invalid
            if (possibleClassesLower[0] === 'a' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0';
            else if (possibleClassesLower[0] === 'b' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0';
            else if (possibleClassesLower[0] === 'c' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0';
            else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0]; // Fallback incorrect mask

            const incorrectCombination = { classKey: `option_class_${possibleClassesLower[0]}`, maskValue: incorrectMaskForIncorrectClass };
            // Avoid adding duplicate option objects
            if (!options.some(o => o.classKey === incorrectCombination.classKey && o.maskValue === incorrectCombination.maskValue)) {
                options.push(incorrectCombination);
            }
        }

        // Ensure 4 options, avoid duplicates
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.maskValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`;
            const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)];
            const potentialOption = { classKey: randomClassKey, maskValue: randomMask };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.maskValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4);
        shuffleArray(options);

        // Explanation focuses on class ranges and default masks
        const explanationInfo = { generatorName: 'generateClassRangeTableHTML', args: [correctClass] };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndDefaultMaskQuestion:", error);
        return null;
    }
}

function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Get a valid A, B, or C IP and calculate portions
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
                portions = getIpPortions(ip, info.defaultMask);
            } else {
                portions = null;
            }
            attempts++;
        } while (!portions && attempts < 100);
        if (!portions) { // Fallback
            ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask);
            if (!portions) throw new Error("Fallback IP failed for portions");
        }

        const question = { key: 'question_given_ip_what_class_net_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class;
        const correctNetworkPortion = portions.networkPortion;
        if (correctNetworkPortion === undefined || correctNetworkPortion === null) throw new Error(`Could not get networkPortion for ${ip}`);

        const correctAnswerObject = {
            classKey: `option_class_${correctClass.toLowerCase()}`,
            portionKey: 'option_network_portion',
            portionValue: correctNetworkPortion || getTranslation('option_none') // Use 'None' if empty string
        };
        let options = [];
        options.push(correctAnswerObject);

        // Generate incorrect options
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());

        // Option: Correct Class, Incorrect Network Portion
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do {
            randomIpForPortion = generateRandomIp();
            randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') {
                incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
            }
            portionAttempts++;
        } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) {
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion });
        } else { // Fallback incorrect portion
            let fallbackPortion = (correctClass !== 'A') ? `${getRandomInt(1,126)}` : `${getRandomInt(128,191)}.${getRandomInt(0,255)}`;
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_network_portion', portionValue: fallbackPortion });
        }

        // Option: Incorrect Class, Correct Network Portion
        if (possibleClassesLower.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || getTranslation('option_none') });
        }

        // Option: Incorrect Class, Incorrect Network Portion
        if (possibleClassesLower.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion });
        }

        // Ensure 4 options, avoid duplicates
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`;
            let randomPortion = '';
            if (randomClassKey === 'option_class_a') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClassKey === 'option_class_b') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            const potentialOption = { classKey: randomClassKey, portionKey: 'option_network_portion', portionValue: randomPortion };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4);
        shuffleArray(options);

        // Calculate values needed for the explanation table
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const firstUsable = getFirstUsableHost(networkAddr, info.defaultMask);
        const lastUsable = getLastUsableHost(broadcastAddr, info.defaultMask);

        // *** MODIFIED Explanation Info ***
        const explanationInfo = {
            generators: [ // Use array for multiple generators
                {
                    // Generator 1: Class Range Table
                    generatorName: 'generateClassRangeTableHTML',
                    args: [correctClass] // Highlight the correct class
                },
                {
                    // Generator 2: Portion Calculation Table
                    generatorName: 'generatePortionExplanationHTML',
                    // Pass 'netaddr' as the key to highlight the Network Address row
                    args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, 'netaddr']
                }
            ],
            // Optional visual separator between tables
            separator: '<hr style="margin: 15px 0; border-color: #eee;">'
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndNetworkPortionQuestion:", error);
        return null;
    }
}

// *** MODIFIED Function (Options Logic) ***
function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Get valid A, B, C IP and portions using default mask
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
                // Use getIpPortions which expects simple masks (0 or 255 octets)
                portions = getIpPortions(ip, info.defaultMask);
            } else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100); // Ensure getIpPortions worked

        if (!portions) { // Fallback
             ip = '172.25.200.15'; // Class B
             info = getIpInfo(ip);
             portions = getIpPortions(ip, info.defaultMask); // Should be 172.25 (Net) / 200.15 (Host)
             if (!portions) throw new Error("Fallback IP failed for portions");
        }

        const question = { key: 'question_given_ip_what_class_host_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; // Get class for explanation
        const correctAnswer = portions.hostPortion || getTranslation('option_none'); // Correct host portion
        const networkPortion = portions.networkPortion || getTranslation('option_none'); // Network portion

        // --- Generar Opciones ---
        let options = new Set();
        options.add(correctAnswer); // 1. Add the correct host portion

        // 2. Add the network portion as a distractor
        if (networkPortion !== correctAnswer && options.size < 4) {
            options.add(networkPortion);
        }

        // 3. Generate adjacent octet combinations from the original IP as distractors
        const ipOctets = ip.split('.');
        let potentialDistractors = [];

        // Determine where the host portion starts based on class/default mask
        let hostStartIndex = -1;
        if (info.class === 'A') hostStartIndex = 1; // Host is .X.Y.Z
        else if (info.class === 'B') hostStartIndex = 2; // Host is .Y.Z
        else if (info.class === 'C') hostStartIndex = 3; // Host is .Z

        if (hostStartIndex !== -1) {
            // Combinations involving adjacent octets
            if (ipOctets.length === 4) {
                // Two octet combos
                if (hostStartIndex <= 1 && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}`); // e.g., from A: 2nd.3rd
                if (hostStartIndex <= 2 && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[2]}.${ipOctets[3]}`); // e.g., from A/B: 3rd.4th
                if (hostStartIndex >= 1 && ipOctets[0] && ipOctets[1]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}`); // e.g., from B/C: 1st.2nd
                if (hostStartIndex >= 2 && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}`); // e.g., from C: 2nd.3rd

                // Single octet combos (from host part mostly)
                if (hostStartIndex <= 1 && ipOctets[1]) potentialDistractors.push(ipOctets[1]); // 2nd octet
                if (hostStartIndex <= 2 && ipOctets[2]) potentialDistractors.push(ipOctets[2]); // 3rd octet
                if (hostStartIndex <= 3 && ipOctets[3]) potentialDistractors.push(ipOctets[3]); // 4th octet

                // Three octet combos (less common, but possible)
                if (hostStartIndex <= 1 && ipOctets[1] && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}.${ipOctets[3]}`); // Correct for Class A
                if (hostStartIndex >= 1 && ipOctets[0] && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}.${ipOctets[2]}`); // Network portion for C
            }
        }

        // Filter out duplicates and the correct answer/network portion from potential distractors
        potentialDistractors = potentialDistractors.filter(d => d !== correctAnswer && d !== networkPortion && d !== ip);
        shuffleArray(potentialDistractors); // Shuffle before adding

        // Add unique distractors until we have 4 options
        for (const distractor of potentialDistractors) {
            if (options.size < 4) {
                options.add(distractor);
            } else {
                break;
            }
        }

        // --- Fallback: If still not 4 options, add Net/Broadcast Addr ---
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, calculateWildcardMask(info.defaultMask));

        if (options.size < 4 && networkAddr && networkAddr !== correctAnswer && !options.has(networkAddr)) {
            options.add(networkAddr);
        }
        if (options.size < 4 && broadcastAddr && broadcastAddr !== correctAnswer && !options.has(broadcastAddr)) {
            options.add(broadcastAddr);
        }
        // --- End Fallback ---

        let optionsArray = Array.from(options);
        // Ensure exactly 4 options, prioritizing the generated ones
         while (optionsArray.length < 4) {
             // Add a simple placeholder if absolutely necessary
             optionsArray.push(`${getRandomInt(1,254)}`);
         }
        optionsArray = optionsArray.slice(0, 4);

        // Final check for correct answer and shuffle
        if (!optionsArray.includes(correctAnswer)) {
             console.warn("Correct answer missing in host portion options, re-adding:", correctAnswer);
             optionsArray.pop(); // Remove last added distractor
             optionsArray.push(correctAnswer);
        }
        shuffleArray(optionsArray);


        // --- Explanation Structure (using previous modifications) ---
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        // Recalculate networkAddr and broadcastAddr if not done in fallback
        const finalNetworkAddr = networkAddr || calculateNetworkAddress(ip, info.defaultMask);
        const finalBroadcastAddr = broadcastAddr || calculateBroadcastAddress(finalNetworkAddr, wildcardMask);
        const firstUsable = getFirstUsableHost(finalNetworkAddr, info.defaultMask);
        const lastUsable = getLastUsableHost(finalBroadcastAddr, info.defaultMask);

        const explanationInfo = {
            generators: [
                {
                    generatorName: 'generateClassRangeTableHTML',
                    args: [correctClass]
                },
                {
                    generatorName: 'generatePortionExplanationHTML',
                    args: [ip, info.defaultMask, wildcardMask, finalNetworkAddr, finalBroadcastAddr, firstUsable, lastUsable, 'usable'] // Highlight usable range
                }
            ],
            separator: '<hr style="margin: 15px 0; border-color: #eee;">'
        };

        // Construct the final object to return, including the correct answer object structure if needed
        const finalCorrectAnswerObject = {
            classKey: `option_class_${correctClass.toLowerCase()}`, // Include class if needed by answer handler
            portionKey: 'option_host_portion',
            portionValue: correctAnswer
        };

        // Note: The 'correctAnswer' field passed back should match the format of the options.
        // Here, options are strings, so correctAnswer should also be the string value.
        return { question, options: optionsArray, correctAnswer: correctAnswer, explanation: explanationInfo };

    } catch (error) {
        console.error("Error en generateClassAndHostPortionQuestion:", error);
        return null;
    }
}


function generateRfc1918Question() {
    try {
        const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
        const rfc1918Blocks = [
            { cidr: '/8', range: '10.0.0.0 - 10.255.255.255', blockStart: '10.0.0.0', class: 'A', blockId: '10.0.0.0/8' },
            { cidr: '/12', range: '172.16.0.0 - 172.31.255.255', blockStart: '172.16.0.0', class: 'B', blockId: '172.16.0.0/12' },
            { cidr: '/16', range: '192.168.0.0 - 192.168.255.255', blockStart: '192.168.0.0', class: 'C', blockId: '192.168.0.0/16' }
        ];
        const otherCidrs = ['/10', '/20', '/24', '/28']; // Incorrect CIDR options
        const possibleClasses = ['A', 'B', 'C']; // Possible class options

        const chosenBlock = rfc1918Blocks[getRandomInt(0, rfc1918Blocks.length - 1)];
        let question = {};
        let correctAnswer = '';
        let options = [];
        let explanationInfo = {};

        const questionType = getRandomInt(0, 2); // 0: CIDR from Block, 1: Range from CIDR, 2: Class from Block
        const rfcLinkHTML = `<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>`;

        if (questionType === 0) { // Ask for CIDR given the block start
            question = { key: 'question_rfc1918_cidr_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockStart: `<strong>${chosenBlock.blockStart}</strong>` } };
            correctAnswer = chosenBlock.cidr;
            options = [correctAnswer];
            let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer);
            shuffleArray(incorrectOptions);
            options.push(...incorrectOptions.slice(0, 3));
        } else if (questionType === 1) { // Ask for Range given the CIDR
            question = { key: 'question_rfc1918_range_from_cidr', replacements: { rfcLinkHTML: rfcLinkHTML, cidr: `<strong>${chosenBlock.cidr}</strong>` } };
            correctAnswer = chosenBlock.range;
            options = [correctAnswer];
            let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range);
            if (incorrectOptions.length < 3) { // Add more filler if needed
                incorrectOptions.push('8.8.0.0 - 8.8.255.255');
            }
            options.push(...incorrectOptions.slice(0, 3));
        } else { // Ask for Class given the Block ID (CIDR)
            const blockIdentifier = chosenBlock.blockId;
            question = { key: 'question_rfc1918_class_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockIdentifier: `<strong>${blockIdentifier}</strong>` } };
            correctAnswer = chosenBlock.class;
            options = [correctAnswer];
            let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer);
            options.push(...incorrectOptions);
        }

        shuffleArray(options);
        if (options.length > 4) options = options.slice(0, 4); // Ensure max 4 options
        // Double-check correct answer is included
        if (!options.includes(correctAnswer)) {
            options.pop(); options.push(correctAnswer); shuffleArray(options);
        }

        // Explanation always uses the private range table
        explanationInfo = { generatorName: 'generatePrivateRangeTableHTML', args: [chosenBlock.blockStart] };
        if (questionType === 2) { // Add extra note for the class question
            explanationInfo.baseTextKey = 'explanation_rfc1918_class_note';
            explanationInfo.replacements = { blockId: `<strong>${chosenBlock.blockId}</strong>`, class: `<strong>${chosenBlock.class}</strong>` };
        }
        return { question, options, correctAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateRfc1918Question:", error);
        return null;
    }
}

// *** MODIFIED Function ***
function generateSpecialAddressQuestion() {
    try {
        // Define the types of special addresses and their keys
        const specialAddressesData = [
            { ip: '127.0.0.1', typeKey: 'loopback', descriptionKey: 'option_loopback' },
            { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, typeKey: 'apipa', descriptionKey: 'option_apipa' },
            { ip: '255.255.255.255', typeKey: 'limited_broadcast', descriptionKey: 'option_limited_broadcast' }
        ];
        const specialTypeKeys = specialAddressesData.map(s => s.descriptionKey); // Option keys for special types
        const normalTypeKeys = ['option_public', 'option_private']; // Option keys for normal types

        // --- 1. Select the IP Type for the Question ---
        // Explicitly decide if the IP will be Special, Public, or Private
        const typeCategory = getRandomInt(1, 3); // 1: Special, 2: Public, 3: Private
        let targetIp = '';
        let ipInfo = {};
        let correctAnswerKey = ''; // The key for the correct answer (e.g., 'option_private')
        let explanationInfo = {}; // Info for generating the explanation
        let attempts = 0;

        if (typeCategory === 1) { // Target IP = Special
            const chosenSpecial = specialAddressesData[getRandomInt(0, specialAddressesData.length - 1)];
            targetIp = chosenSpecial.ip;
            correctAnswerKey = chosenSpecial.descriptionKey;
            explanationInfo = { generatorName: 'generateSpecialAddressExplanationHTML', args: [chosenSpecial.typeKey] };
        } else if (typeCategory === 3) { // Target IP = Private
            targetIp = generateRandomPrivateIp(); // Generate a random private IP
            correctAnswerKey = 'option_private'; // The correct answer is 'Private'
            explanationInfo = { generatorName: 'generatePrivateRangeTableHTML', args: [targetIp] }; // Use RFC1918 table for explanation
        } else { // Target IP = Public (typeCategory === 2)
            // Generate random IPs until a public one is found
            do {
                targetIp = generateRandomIp();
                ipInfo = getIpInfo(targetIp);
                attempts++;
            } while (ipInfo.typeKey !== 'public' && attempts < 100);
            // Fallback if random generation fails
            if (ipInfo.typeKey !== 'public') {
                targetIp = '8.8.8.8'; // Fallback to Google DNS
                ipInfo = getIpInfo(targetIp);
            }
            correctAnswerKey = 'option_public'; // The correct answer is 'Public'
            explanationInfo = { generatorName: 'generatePrivateRangeTableHTML', args: [targetIp] }; // Use RFC1918 table for explanation (will show it's not private)
        }

        // --- 2. Generate Answer Options ---
        let optionsSet = new Set();
        optionsSet.add(correctAnswerKey); // Always include the correct answer

        let incorrectPool = []; // Pool of possible incorrect options
        if (normalTypeKeys.includes(correctAnswerKey)) {
            // If correct is Public or Private, incorrect options are the special types + the other normal type
            incorrectPool = [...specialTypeKeys];
            const otherNormal = normalTypeKeys.find(k => k !== correctAnswerKey);
            if (otherNormal) optionsSet.add(otherNormal); // Ensure the other (Public/Private) is present
        } else {
            // If correct is Special, incorrect options are other special types + Public + Private
            incorrectPool = [...specialTypeKeys.filter(k => k !== correctAnswerKey), ...normalTypeKeys];
             // Ensure Public and Private are included as options
            optionsSet.add('option_public');
            optionsSet.add('option_private');
        }

        // Fill remaining options from the incorrect pool
        shuffleArray(incorrectPool);
        for (const incorrect of incorrectPool) {
            if (optionsSet.size < 4) {
                optionsSet.add(incorrect);
            } else {
                break;
            }
        }
         // Ensure 4 options (unlikely needed here, but safe)
         while (optionsSet.size < 4) {
             const allTypes = [...specialTypeKeys, ...normalTypeKeys];
             const missing = allTypes.find(t => !optionsSet.has(t));
             if (missing) optionsSet.add(missing); else break;
         }

        let optionsArray = Array.from(optionsSet).slice(0, 4);
        // Verify correct answer is included (just in case) and shuffle
        if (!optionsArray.includes(correctAnswerKey)) {
             optionsArray.pop(); optionsArray.push(correctAnswerKey);
        }
        shuffleArray(optionsArray);

        // --- 3. Format Question and Return ---
        // For simplicity, always ask "What type is this IP?"
        const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
        return { question, options: optionsArray, correctAnswer: correctAnswerKey, explanation: explanationInfo };

        // Note: Removed logic that asked "Which of these IPs is type X?"
        // to simplify and ensure the target IP is always shown.

    } catch (error) {
        console.error("Error en generateSpecialAddressQuestion:", error);
        return null; // Return null on error
    }
}


function generateIdentifyNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Get valid A, B, C IP and portions
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
                portions = getIpPortions(ip, info.defaultMask);
            } else {
                portions = null;
            }
            attempts++;
        } while (!portions && attempts < 100);
        if (!portions) { // Fallback
             ip = '192.168.10.50'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask);
             if (!portions) throw new Error("Fallback IP failed for portions");
        }

        const question = { key: 'question_identify_network_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.networkPortion || getTranslation('option_none');
        const hostPortion = portions.hostPortion || getTranslation('option_none'); // Get host portion for distractor

        // --- Generate Options ---
        let options = new Set();
        options.add(correctAnswer); // 1. Correct network portion

        // 2. Host portion as distractor
        if (hostPortion !== correctAnswer && options.size < 4) {
            options.add(hostPortion);
        }

        // 3. Generate adjacent octet combinations from the original IP as distractors
        const ipOctets = ip.split('.');
        let potentialDistractors = [];
        let networkStartIndex = -1;
        if (info.class === 'A') networkStartIndex = 0; // Network is X.
        else if (info.class === 'B') networkStartIndex = 1; // Network is X.Y.
        else if (info.class === 'C') networkStartIndex = 2; // Network is X.Y.Z.

        if (networkStartIndex !== -1 && ipOctets.length === 4) {
             // Single octets (from network part mostly)
             if (networkStartIndex >= 0 && ipOctets[0]) potentialDistractors.push(ipOctets[0]);
             if (networkStartIndex >= 1 && ipOctets[1]) potentialDistractors.push(ipOctets[1]);
             if (networkStartIndex >= 2 && ipOctets[2]) potentialDistractors.push(ipOctets[2]);

             // Two octet combos
             if (networkStartIndex >= 1 && ipOctets[0] && ipOctets[1]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}`); // Correct for Class B
             if (networkStartIndex >= 2 && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}`);
             if (networkStartIndex <= 1 && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[2]}.${ipOctets[3]}`); // Host part for B

             // Three octet combos
             if (networkStartIndex >= 2 && ipOctets[0] && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}.${ipOctets[2]}`); // Correct for Class C
             if (networkStartIndex <= 0 && ipOctets[1] && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}.${ipOctets[3]}`); // Host part for A
        }

        // Filter out duplicates and the correct/host portions
        potentialDistractors = potentialDistractors.filter(d => d !== correctAnswer && d !== hostPortion && d !== ip);
        shuffleArray(potentialDistractors);

        // Add unique distractors until 4 options
        for (const distractor of potentialDistractors) {
            if (options.size < 4) { options.add(distractor); } else { break; }
        }

        // --- Fallback: Add Net/Broadcast Addr if still needed ---
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, calculateWildcardMask(info.defaultMask));
        if (options.size < 4 && networkAddr && networkAddr !== correctAnswer && !options.has(networkAddr)) {
            options.add(networkAddr);
        }
        if (options.size < 4 && broadcastAddr && broadcastAddr !== correctAnswer && !options.has(broadcastAddr)) {
            options.add(broadcastAddr);
        }
        // --- End Fallback ---

        let optionsArray = Array.from(options);
         while (optionsArray.length < 4) { optionsArray.push(`${getRandomInt(1,254)}`); } // Final simple fallback
        optionsArray = optionsArray.slice(0, 4);

        if (!optionsArray.includes(correctAnswer)) { // Ensure correct is present
             optionsArray.pop(); optionsArray.push(correctAnswer);
        }
        shuffleArray(optionsArray);

        // --- Explanation ---
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const firstUsable = getFirstUsableHost(networkAddr, info.defaultMask);
        const lastUsable = getLastUsableHost(broadcastAddr, info.defaultMask);
        const correctClass = info.class;
        const explanationInfo = {
            generators: [
                { generatorName: 'generateClassRangeTableHTML', args: [correctClass] },
                { generatorName: 'generatePortionExplanationHTML', args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, 'netaddr'] } // Highlight netaddr
            ],
            separator: '<hr style="margin: 15px 0; border-color: #eee;">'
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateIdentifyNetworkPortionQuestion:", error);
        return null;
    }
}

// *** MODIFIED Function (Options Logic + Explanation Structure) ***
function generateIdentifyHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Get valid A, B, C IP and portions using default mask
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
                // Use getIpPortions which expects simple masks (0 or 255 octets)
                portions = getIpPortions(ip, info.defaultMask);
            } else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100); // Ensure getIpPortions worked

        if (!portions) { // Fallback
             ip = '172.25.200.15'; // Class B
             info = getIpInfo(ip);
             portions = getIpPortions(ip, info.defaultMask); // Should be 172.25 (Net) / 200.15 (Host)
             if (!portions) throw new Error("Fallback IP failed for portions");
        }

        const question = { key: 'question_identify_host_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.hostPortion || getTranslation('option_none'); // Correct host portion
        const networkPortion = portions.networkPortion || getTranslation('option_none'); // Network portion

        // --- Generar Opciones ---
        let options = new Set();
        options.add(correctAnswer); // 1. Add the correct host portion

        // 2. Add the network portion as a distractor
        if (networkPortion !== correctAnswer && options.size < 4) {
            options.add(networkPortion);
        }

        // 3. Generate adjacent octet combinations from the original IP as distractors
        const ipOctets = ip.split('.');
        let potentialDistractors = [];

        // Determine where the host portion starts based on class/default mask
        let hostStartIndex = -1;
        if (info.class === 'A') hostStartIndex = 1; // Host is .X.Y.Z
        else if (info.class === 'B') hostStartIndex = 2; // Host is .Y.Z
        else if (info.class === 'C') hostStartIndex = 3; // Host is .Z

        if (hostStartIndex !== -1) {
            // Combinations involving adjacent octets
            if (ipOctets.length === 4) {
                // Two octet combos
                if (hostStartIndex <= 1 && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}`); // e.g., from A: 2nd.3rd
                if (hostStartIndex <= 2 && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[2]}.${ipOctets[3]}`); // e.g., from A/B: 3rd.4th
                if (hostStartIndex >= 1 && ipOctets[0] && ipOctets[1]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}`); // e.g., from B/C: 1st.2nd
                if (hostStartIndex >= 2 && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}`); // e.g., from C: 2nd.3rd

                // Single octet combos (from host part mostly)
                if (hostStartIndex <= 1 && ipOctets[1]) potentialDistractors.push(ipOctets[1]); // 2nd octet
                if (hostStartIndex <= 2 && ipOctets[2]) potentialDistractors.push(ipOctets[2]); // 3rd octet
                if (hostStartIndex <= 3 && ipOctets[3]) potentialDistractors.push(ipOctets[3]); // 4th octet

                // Three octet combos (less common, but possible)
                if (hostStartIndex <= 1 && ipOctets[1] && ipOctets[2] && ipOctets[3]) potentialDistractors.push(`${ipOctets[1]}.${ipOctets[2]}.${ipOctets[3]}`); // Correct for Class A
                if (hostStartIndex >= 1 && ipOctets[0] && ipOctets[1] && ipOctets[2]) potentialDistractors.push(`${ipOctets[0]}.${ipOctets[1]}.${ipOctets[2]}`); // Network portion for C
            }
        }

        // Filter out duplicates and the correct answer/network portion from potential distractors
        potentialDistractors = potentialDistractors.filter(d => d !== correctAnswer && d !== networkPortion && d !== ip);
        shuffleArray(potentialDistractors); // Shuffle before adding

        // Add unique distractors until we have 4 options
        for (const distractor of potentialDistractors) {
            if (options.size < 4) {
                options.add(distractor);
            } else {
                break;
            }
        }

        // --- Fallback: If still not 4 options, add Net/Broadcast Addr ---
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, calculateWildcardMask(info.defaultMask));

        if (options.size < 4 && networkAddr && networkAddr !== correctAnswer && !options.has(networkAddr)) {
            options.add(networkAddr);
        }
        if (options.size < 4 && broadcastAddr && broadcastAddr !== correctAnswer && !options.has(broadcastAddr)) {
            options.add(broadcastAddr);
        }
        // --- End Fallback ---

        let optionsArray = Array.from(options);
        // Ensure exactly 4 options, prioritizing the generated ones
         while (optionsArray.length < 4) {
             // Add a simple placeholder if absolutely necessary
             optionsArray.push(`${getRandomInt(1,254)}`);
         }
        optionsArray = optionsArray.slice(0, 4);

        // Final check for correct answer and shuffle
        if (!optionsArray.includes(correctAnswer)) {
             console.warn("Correct answer missing in host portion options, re-adding:", correctAnswer);
             optionsArray.pop(); // Remove last added distractor
             optionsArray.push(correctAnswer);
        }
        shuffleArray(optionsArray);


        // --- Explanation Structure (using previous modifications) ---
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        // Recalculate networkAddr and broadcastAddr if not done in fallback
        const finalNetworkAddr = networkAddr || calculateNetworkAddress(ip, info.defaultMask);
        const finalBroadcastAddr = broadcastAddr || calculateBroadcastAddress(finalNetworkAddr, wildcardMask);
        const firstUsable = getFirstUsableHost(finalNetworkAddr, info.defaultMask);
        const lastUsable = getLastUsableHost(finalBroadcastAddr, info.defaultMask);
        const correctClass = info.class;

        const explanationInfo = {
            generators: [
                {
                    generatorName: 'generateClassRangeTableHTML',
                    args: [correctClass]
                },
                {
                    generatorName: 'generatePortionExplanationHTML',
                    args: [ip, info.defaultMask, wildcardMask, finalNetworkAddr, finalBroadcastAddr, firstUsable, lastUsable, 'usable'] // Highlight usable range
                }
            ],
            separator: '<hr style="margin: 15px 0; border-color: #eee;">'
        };

        // Note: The 'correctAnswer' field passed back should match the format of the options.
        // Here, options are strings, so correctAnswer should also be the string value.
        return { question, options: optionsArray, correctAnswer: correctAnswer, explanation: explanationInfo };

    } catch (error) {
        console.error("Error en generateIdentifyHostPortionQuestion:", error);
        return null;
    }
}


function generateNetworkBroadcastAddressQuestion() {
    try {
        let ip, info, attempts = 0;
        // Get valid A, B, C IP
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.typeKey === 'loopback') && attempts < 100);
        if (attempts >= 100) { // Fallback
             ip = '172.18.120.30'; info = getIpInfo(ip);
        }

        const mask = info.defaultMask;
        const networkAddr = calculateNetworkAddress(ip, mask);
        const wildcardMask = calculateWildcardMask(mask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);

        if (!networkAddr || !broadcastAddr || !wildcardMask) {
            throw new Error(`Error calculating network/broadcast/wildcard for ${ip} / ${mask}`);
        }

        // Decide whether to ask for Network or Broadcast address
        const askForNetwork = Math.random() < 0.5;
        const questionTypeKey = askForNetwork ? "address_type_network" : "address_type_broadcast";
        const correctAnswer = askForNetwork ? networkAddr : broadcastAddr;
        const question = {
            key: 'question_calculate_address',
            replacements: {
                ip: `<strong>${ip}</strong>`,
                mask: `<strong>${mask}</strong>`,
                addressType: `<strong>${getTranslation(questionTypeKey)}</strong>`
            }
        };

        // Generate options
        let options = new Set([correctAnswer]);
        const otherAddress = askForNetwork ? broadcastAddr : networkAddr;
        if (otherAddress !== correctAnswer) options.add(otherAddress); // Add the opposite address (Net/Broad)
        if (ip !== correctAnswer && !options.has(ip)) options.add(ip); // Add the original IP if different

        // Add network/broadcast from another random IP as incorrect options
        let randomIp2, randomInfo2, randomNetAddr, randomBroadAddr, attempts2 = 0;
        do {
            randomIp2 = generateRandomIp();
            randomInfo2 = getIpInfo(randomIp2);
            attempts2++;
        } while ((randomInfo2.class !== 'A' && randomInfo2.class !== 'B' && randomInfo2.class !== 'C' || randomInfo2.typeKey === 'loopback') && attempts2 < 50);

        if (randomInfo2.defaultMask !== 'N/A') {
            randomNetAddr = calculateNetworkAddress(randomIp2, randomInfo2.defaultMask);
            const randomWildcard = calculateWildcardMask(randomInfo2.defaultMask);
            if (randomNetAddr && randomWildcard) {
                randomBroadAddr = calculateBroadcastAddress(randomNetAddr, randomWildcard);
                if (randomNetAddr && randomNetAddr !== correctAnswer && !options.has(randomNetAddr)) {
                    options.add(randomNetAddr);
                }
                if (randomBroadAddr && randomBroadAddr !== correctAnswer && !options.has(randomBroadAddr)) {
                    options.add(randomBroadAddr);
                }
            }
        }

        // Fill remaining options with random IPs
        while (options.size < 4) {
            let randomOptionIp = generateRandomIp();
            if (randomOptionIp !== correctAnswer && !options.has(randomOptionIp)) {
                options.add(randomOptionIp);
            }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { // Ensure correct answer is present
             optionsArray.pop(); optionsArray.push(correctAnswer);
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4 options
        shuffleArray(optionsArray);

        // --- Explanation ---
        const firstUsable = getFirstUsableHost(networkAddr, mask);
        const lastUsable = getLastUsableHost(broadcastAddr, mask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            // Highlight the correct answer type (network or broadcast) and show usable range
            args: [ip, mask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, askForNetwork ? 'netaddr' : 'broadaddr']
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateNetworkBroadcastAddressQuestion:", error);
        return null;
    }
}

// --- Generadores de Preguntas (Nivel Professional) ---

function generateClassTypeMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Get valid A, B, C IP
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.typeKey === 'loopback') && attempts < 100);
        if (attempts >= 100) { // Fallback
             ip = '198.18.0.1'; info = getIpInfo(ip); // Example public class C range
        }

        const question = { key: 'question_given_ip_what_class_type_mask', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class;
        const correctTypeKey = info.typeKey;
        const correctMask = info.defaultMask;
        const correctAnswerObject = {
            classKey: `option_class_${correctClass.toLowerCase()}`,
            typeKey: `option_${correctTypeKey}`,
            maskValue: correctMask
        };
        let options = [];
        options.push(correctAnswerObject);

        // Generate incorrect options by varying class, type, or mask
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());
        const possibleTypeKeys = ['option_public', 'option_private'].filter(k => k !== `option_${correctTypeKey}`);
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);

        // Option: Correct Class & Type, Incorrect Mask
        if (possibleMasks.length > 0) {
            options.push({ ...correctAnswerObject, maskValue: possibleMasks[0] });
        }
        // Option: Correct Class & Mask, Incorrect Type
        if (possibleTypeKeys.length > 0) {
            options.push({ ...correctAnswerObject, typeKey: possibleTypeKeys[0] });
        }
        // Option: Incorrect Class, Correct Type & Mask (if possible)
        if (possibleClassesLower.length > 0) {
            let incorrectMask = '255.255.255.255'; // Default invalid
            if (possibleClassesLower[0] === 'a') incorrectMask = '255.0.0.0';
            else if (possibleClassesLower[0] === 'b') incorrectMask = '255.255.0.0';
            else if (possibleClassesLower[0] === 'c') incorrectMask = '255.255.255.0';
            options.push({
                 classKey: `option_class_${possibleClassesLower[0]}`,
                 typeKey: correctAnswerObject.typeKey, // Keep original type
                 maskValue: incorrectMask // Use default mask for the incorrect class
            });
        }

        // Ensure 4 options, avoid duplicates
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.typeKey},${o.maskValue}`));
        attempts = 0; // Reset attempts counter for filling options
        while (options.length < 4 && attempts < 500) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`;
            const randomTypeKey = ['option_public', 'option_private'][getRandomInt(0, 1)];
            const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)];
            const potentialOption = { classKey: randomClassKey, typeKey: randomTypeKey, maskValue: randomMask };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.typeKey},${potentialOption.maskValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
            attempts++;
        }
        options = options.slice(0, 4);
        shuffleArray(options);

        // Double-check correct answer is included
        if (!options.some(o => o.classKey === correctAnswerObject.classKey && o.typeKey === correctAnswerObject.typeKey && o.maskValue === correctAnswerObject.maskValue)) {
            options.pop(); options.push(correctAnswerObject); shuffleArray(options);
        }

        // Combine explanations for class and type
        const explanationInfo = {
            generators: [
                { generatorName: 'generateClassRangeTableHTML', args: [correctClass] },
                { generatorName: 'generatePrivateRangeTableHTML', args: [ip] }
            ],
            separator: '<hr style="margin: 10px 0;">'
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassTypeMaskQuestion:", error);
        return null;
    }
}

function generateWildcardQuestion() {
    try {
        const subnetMask = generateRandomSubnetMask(); // Generate a random valid subnet mask
        const correctAnswer = calculateWildcardMask(subnetMask);
        if (!correctAnswer) throw new Error("Could not calculate correct wildcard.");

        const question = { key: 'question_calculate_wildcard', replacements: { subnetMask: `<strong>${subnetMask}</strong>` } };
        let options = new Set([correctAnswer]);
        let attempts = 0;

        // Generate incorrect options
        while (options.size < 4 && attempts < 50) {
            // Incorrect wildcard from another random mask
            const randomMask = generateRandomSubnetMask();
            if (randomMask !== subnetMask) {
                const incorrectWildcard = calculateWildcardMask(randomMask);
                if (incorrectWildcard && incorrectWildcard !== correctAnswer) {
                    options.add(incorrectWildcard);
                }
            }
            // Add the original subnet mask as an incorrect option (common mistake)
            if (subnetMask !== correctAnswer && options.size < 4) {
                options.add(subnetMask);
            }
            // Add wildcard from a default mask
            const defaultMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
            const randomDefault = defaultMasks[getRandomInt(0, defaultMasks.length - 1)];
            const incorrectDefaultWildcard = calculateWildcardMask(randomDefault);
            if (incorrectDefaultWildcard && incorrectDefaultWildcard !== correctAnswer && options.size < 4) {
                options.add(incorrectDefaultWildcard);
            }
            attempts++;
        }

        // Fill with simple wildcards if still needed
        const simpleWildcards = ['0.0.0.0', '0.0.0.255', '0.0.255.255', '0.255.255.255'];
        shuffleArray(simpleWildcards);
        for(const wc of simpleWildcards) {
            if (options.size < 4 && wc !== correctAnswer) {
                options.add(wc);
            }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { // Ensure correct is present
             optionsArray.pop(); optionsArray.push(correctAnswer);
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4
        shuffleArray(optionsArray);

        const explanationInfo = { generatorName: 'generateWildcardExplanationHTML', args: [subnetMask, correctAnswer] };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateWildcardQuestion:", error);
        return null;
    }
}

function generateSubnettingQuestion() {
    try {
        let ip, info, subnetMask, prefixLength, originalClassMask, originalPrefix;
        let attempts = 0;
        // Generate a valid subnetting scenario (subnet mask different from default, prefix <= 30)
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class !== 'A' && info.class !== 'B' && info.class !== 'C') continue; // Need classful IP for default mask comparison
            originalClassMask = info.defaultMask;
            originalPrefix = getMaskPrefixLength(originalClassMask);
            subnetMask = generateRandomSubnetMask();
            prefixLength = getMaskPrefixLength(subnetMask);
            // Check if valid subnetting scenario generated
            if (prefixLength !== null && subnetMask !== originalClassMask && prefixLength > originalPrefix && prefixLength <= 30) {
                break;
            }
            attempts++;
        } while (attempts < 100);

        if (attempts >= 100) { // Fallback scenario
            ip = '192.168.1.150'; info = getIpInfo(ip); subnetMask = '255.255.255.192'; prefixLength = 26;
            originalClassMask = '255.255.255.0'; originalPrefix = 24;
        }

        // Calculate necessary values
        const networkAddr = calculateNetworkAddress(ip, subnetMask);
        const wildcardMask = calculateWildcardMask(subnetMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const usableHosts = calculateUsableHosts(subnetMask);
        const numSubnets = calculateNumberOfSubnets(originalClassMask, subnetMask);

        if (networkAddr === null || broadcastAddr === null || usableHosts === null || numSubnets === null) {
            throw new Error(`Error calculating subnetting values for ${ip}/${subnetMask}`);
        }

        // Randomly choose what to ask (Net Addr, Broad Addr, Usable Hosts, Num Subnets)
        const questionType = getRandomInt(0, 3);
        let questionKey = '';
        let correctAnswer;
        let options = new Set();
        let correctAnswerFormatted; // For display (numbers formatted)

        switch (questionType) {
            case 0: // Ask for Network Address
                questionKey = 'question_subnetting_calculate_network';
                correctAnswer = networkAddr;
                options.add(correctAnswer);
                options.add(broadcastAddr); // Add broadcast as distractor
                if(ip !== networkAddr) options.add(ip); // Add original IP if different
                // Add another network address from a different IP but same mask
                let randomNetAddr;
                do { randomNetAddr = calculateNetworkAddress(generateRandomIp(), subnetMask); }
                while (!randomNetAddr || randomNetAddr === correctAnswer);
                options.add(randomNetAddr);
                correctAnswerFormatted = correctAnswer;
                break;
            case 1: // Ask for Broadcast Address
                questionKey = 'question_subnetting_calculate_broadcast';
                correctAnswer = broadcastAddr;
                options.add(correctAnswer);
                options.add(networkAddr); // Add network as distractor
                if(ip !== broadcastAddr) options.add(ip); // Add original IP if different
                // Add another broadcast address
                let randomBroadAddr;
                do {
                    const tempNet = calculateNetworkAddress(generateRandomIp(), subnetMask);
                    const tempWild = calculateWildcardMask(subnetMask);
                    if(tempNet && tempWild) randomBroadAddr = calculateBroadcastAddress(tempNet, tempWild);
                } while (!randomBroadAddr || randomBroadAddr === correctAnswer);
                options.add(randomBroadAddr);
                correctAnswerFormatted = correctAnswer;
                break;
            case 2: // Ask for Usable Hosts
                questionKey = 'question_subnetting_calculate_usable_hosts';
                correctAnswer = usableHosts;
                options.add(correctAnswer);
                const hostBits = 32 - prefixLength;
                // Add total hosts (2^h) as distractor
                if (hostBits >= 2) options.add(Number(BigInt(2) ** BigInt(hostBits)));
                // Add hosts from adjacent prefixes as distractors
                if (hostBits > 2) options.add(Number(BigInt(2) ** BigInt(hostBits - 1) - BigInt(2)));
                if (hostBits < 30 && prefixLength > originalPrefix) options.add(Number(BigInt(2) ** BigInt(hostBits + 1) - BigInt(2)));
                correctAnswerFormatted = formatNumber(correctAnswer); // Format number for display
                break;
            case 3: // Ask for Number of Subnets
                questionKey = 'question_subnetting_calculate_num_subnets';
                correctAnswer = numSubnets;
                options.add(correctAnswer);
                const subnetBits = prefixLength - originalPrefix;
                // Add subnets from adjacent prefixes as distractors
                if (subnetBits > 0) {
                    const lowerPower = Number(BigInt(2) ** BigInt(subnetBits - 1));
                    if (lowerPower >= 1 && lowerPower !== correctAnswer) options.add(lowerPower);
                }
                const nextSubnetBits = subnetBits + 1;
                if ((originalPrefix + nextSubnetBits) <= 30) {
                    const higherPower = Number(BigInt(2) ** BigInt(nextSubnetBits));
                    if (higherPower !== correctAnswer) options.add(higherPower);
                }
                // Add number of subnet bits or prefix length as distractors
                if (subnetBits > 0 && subnetBits !== correctAnswer) options.add(subnetBits);
                if (prefixLength !== correctAnswer) options.add(prefixLength);
                correctAnswerFormatted = formatNumber(correctAnswer); // Format number for display
                break;
        }

        // Fill remaining options
        let fillAttempts = 0;
        while(options.size < 4 && fillAttempts < 50) {
            if (questionType <= 1) { // Fill with random IPs
                let randomIpOption = generateRandomIp();
                if (randomIpOption !== correctAnswer && !options.has(randomIpOption)) {
                    options.add(randomIpOption);
                }
            } else { // Fill with random numbers close to the answer
                let randomNumOption;
                const base = correctAnswer > 4 ? correctAnswer : 2;
                const range = Math.max(10, Math.ceil(base / 2));
                randomNumOption = getRandomInt(Math.max(1, base - range), base + range);
                if (correctAnswer !== 0 && randomNumOption === 0) randomNumOption = 1; // Avoid 0 unless answer is 0
                if (randomNumOption !== correctAnswer && !options.has(randomNumOption)) {
                    options.add(randomNumOption);
                }
            }
            fillAttempts++;
        }

        // Format options if they are numbers
        let optionsArray = Array.from(options).map(opt => {
            return (questionType >= 2) ? formatNumber(opt) : opt.toString();
        });

        if (!optionsArray.includes(correctAnswerFormatted)) { // Ensure correct answer is present
             optionsArray.pop(); optionsArray.push(correctAnswerFormatted);
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4
        shuffleArray(optionsArray);

        const question = {
            key: questionKey,
            replacements: {
                ip: `<strong>${ip}</strong>`,
                mask: `<strong>${subnetMask}</strong>`,
                prefixLength: prefixLength,
                class: info.class // Needed for num_subnets question
            }
        };
        const explanationInfo = {
            generatorName: 'generateSubnettingExplanationHTML',
            args: [ip, subnetMask, networkAddr, broadcastAddr, usableHosts, numSubnets, originalClassMask]
        };
        return { question, options: optionsArray, correctAnswer: correctAnswerFormatted, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSubnettingQuestion:", error);
        return null;
    }
}

function generateIdentifyIpTypeQuestion() {
    try {
        let ip, info, subnetMask, prefixLength, networkAddr, broadcastAddr, firstUsable, lastUsable;
        let attempts = 0;
        // Generate a valid subnetting scenario
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class !== 'A' && info.class !== 'B' && info.class !== 'C') continue;
            subnetMask = generateRandomSubnetMask();
            prefixLength = getMaskPrefixLength(subnetMask);
            // Ensure it's actual subnetting and prefix allows usable hosts
            if (prefixLength !== null && subnetMask !== info.defaultMask && prefixLength <= 30) {
                networkAddr = calculateNetworkAddress(ip, subnetMask);
                const wildcardMask = calculateWildcardMask(subnetMask);
                broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
                firstUsable = getFirstUsableHost(networkAddr, subnetMask);
                lastUsable = getLastUsableHost(broadcastAddr, subnetMask);
                if (networkAddr && broadcastAddr && firstUsable && lastUsable) {
                    break; // Found a valid scenario
                }
            }
            attempts++;
        } while (attempts < 100);

        if (attempts >= 100) { // Fallback scenario
            ip = '192.168.1.150'; subnetMask = '255.255.255.192'; prefixLength = 26;
            networkAddr = '192.168.1.128'; broadcastAddr = '192.168.1.191';
            firstUsable = '192.168.1.129'; lastUsable = '192.168.1.190';
        }

        // Choose which type of IP to present as the target
        const typeChoice = getRandomInt(0, 2); // 0: Network, 1: Broadcast, 2: Usable
        let targetIp = '';
        let correctAnswerKey = ''; // Key for the correct option (e.g., 'option_network_address')
        let correctIpType = ''; // Internal type key ('network', 'broadcast', 'usable') for explanation

        if (typeChoice === 0) {
            targetIp = networkAddr;
            correctAnswerKey = 'option_network_address';
            correctIpType = 'network';
        } else if (typeChoice === 1) {
            targetIp = broadcastAddr;
            correctAnswerKey = 'option_broadcast_address';
            correctIpType = 'broadcast';
        } else {
            // Choose randomly between first and last usable host
            targetIp = (Math.random() < 0.5) ? firstUsable : lastUsable;
            correctAnswerKey = 'option_usable_host_address';
            correctIpType = 'usable';
        }

        const question = {
            key: 'question_identify_ip_type_in_subnet',
            replacements: {
                ip: `<strong>${ip}</strong>`, // Original IP used to define subnet context
                mask: `<strong>${subnetMask}</strong>`,
                prefixLength: prefixLength,
                targetIp: `<strong>${targetIp}</strong>` // The IP whose type needs identifying
            }
        };

        // Define the possible options
        let options = [
            'option_network_address',
            'option_broadcast_address',
            'option_usable_host_address'
        ];
        // Add a distractor like 'Private' or 'Public' if space allows
        const baseIpInfo = getIpInfo(ip);
        if (baseIpInfo.typeKey === 'private') {
             options.push('option_public');
        } else {
             options.push('option_private');
        }

        shuffleArray(options);
        if (!options.includes(correctAnswerKey)) { // Ensure correct is present
            options.pop(); options.push(correctAnswerKey); shuffleArray(options);
        }
        options = options.slice(0, 4); // Limit to 4 options

        const explanationInfo = {
            generatorName: 'generateIpTypeExplanationHTML',
            args: [targetIp, correctIpType, networkAddr, broadcastAddr, prefixLength]
        };
        return { question, options, correctAnswer: correctAnswerKey, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateIdentifyIpTypeQuestion:", error);
        return null;
    }
}

function generateBitsForSubnetsQuestion() {
    try {
        const classes = ['A', 'B', 'C'];
        const chosenClass = classes[getRandomInt(0, classes.length - 1)];
        let defaultPrefix;
        if (chosenClass === 'A') defaultPrefix = 8;
        else if (chosenClass === 'B') defaultPrefix = 16;
        else defaultPrefix = 24;

        // Determine a reasonable range for required subnets based on class
        let maxPossibleSubnetBits = 30 - defaultPrefix; // Max bits we can borrow (up to /30)
        if (maxPossibleSubnetBits <= 1) return null; // Cannot subnet meaningfully

        const minSubnets = 2; // Need at least 2 subnets
        const maxSubnets = Math.pow(2, maxPossibleSubnetBits); // Theoretical max
        // Choose a random number of required subnets within a practical range
        const requiredSubnets = getRandomInt(minSubnets, Math.min(maxSubnets, 10000)); // Limit to 10k for sanity

        // Calculate the minimum bits needed
        const subnetBits = Math.ceil(Math.log2(requiredSubnets));
        const correctAnswer = subnetBits;

        // Generate options
        let options = new Set([correctAnswer]);
        // Add adjacent bit counts as distractors
        if (correctAnswer > 1) options.add(correctAnswer - 1);
        if ((defaultPrefix + correctAnswer + 1) <= 30) options.add(correctAnswer + 1); // Ensure we don't exceed /30
        // Add the required number of subnets itself as a distractor
        options.add(requiredSubnets);
        // Add a random prefix length as a distractor
        const randomMaskPrefix = getMaskPrefixLength(generateRandomSubnetMask());
        if(randomMaskPrefix && randomMaskPrefix !== correctAnswer) options.add(randomMaskPrefix);

        // Fill remaining options with nearby numbers
        let fillAttempts = 0;
        while(options.size < 4 && fillAttempts < 50) {
            let randomNumOption = getRandomInt(Math.max(1, correctAnswer - 3), correctAnswer + 3);
            if (randomNumOption !== correctAnswer && !options.has(randomNumOption) && randomNumOption > 0) {
                options.add(randomNumOption);
            }
            fillAttempts++;
        }

        let optionsArray = Array.from(options).map(opt => opt.toString()); // Options are numbers of bits
        if (!optionsArray.includes(correctAnswer.toString())) { // Ensure correct is present
             optionsArray.pop(); optionsArray.push(correctAnswer.toString());
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4
        shuffleArray(optionsArray);

        const question = {
            key: 'question_bits_for_subnets',
            replacements: {
                class: chosenClass,
                defaultPrefix: defaultPrefix,
                requiredSubnets: formatNumber(requiredSubnets)
            }
        };
        const resultingSubnets = Number(BigInt(2) ** BigInt(subnetBits)); // Actual subnets created
        const explanationInfo = {
            generatorName: 'generateBitsForSubnetsExplanationHTML',
            args: [requiredSubnets, subnetBits, resultingSubnets]
        };
        return { question, options: optionsArray, correctAnswer: correctAnswer.toString(), explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateBitsForSubnetsQuestion:", error);
        return null;
    }
}

function generateBitsForHostsQuestion() {
    try {
        const minHostBitsNeeded = 2; // Need at least 2 bits for Net+Broad+Usable
        const maxHostBitsPossible = 16; // Practical upper limit for required hosts calculation
        // Generate a random number of required usable hosts
        const requiredHosts = getRandomInt(2, Math.pow(2, maxHostBitsPossible) - 2);

        // Calculate minimum host bits (h) needed: 2^h >= requiredHosts + 2
        const hostBits = Math.ceil(Math.log2(requiredHosts + 2));
        const correctAnswer = hostBits;

        // Generate options
        let options = new Set([correctAnswer]);
        // Add adjacent bit counts
        if (correctAnswer > minHostBitsNeeded) options.add(correctAnswer - 1);
        if (correctAnswer < 30) options.add(correctAnswer + 1); // Cannot have more than 30 host bits realistically
        // Add required hosts number as distractor
        options.add(requiredHosts);
        // Add common network bit counts as distractors
        const commonNetBits = [8, 16, 24];
        options.add(commonNetBits[getRandomInt(0, commonNetBits.length - 1)]);

        // Fill remaining options with nearby numbers
        let fillAttempts = 0;
        while(options.size < 4 && fillAttempts < 50) {
            let randomNumOption = getRandomInt(Math.max(minHostBitsNeeded, correctAnswer - 3), correctAnswer + 3);
            if (randomNumOption !== correctAnswer && !options.has(randomNumOption)) {
                options.add(randomNumOption);
            }
            fillAttempts++;
        }

        let optionsArray = Array.from(options).map(opt => opt.toString()); // Options are numbers of bits
        if (!optionsArray.includes(correctAnswer.toString())) { // Ensure correct is present
             optionsArray.pop(); optionsArray.push(correctAnswer.toString());
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4
        shuffleArray(optionsArray);

        const question = {
            key: 'question_bits_for_hosts',
            replacements: { requiredHosts: formatNumber(requiredHosts) }
        };
        const resultingHosts = Number(BigInt(2) ** BigInt(hostBits) - BigInt(2)); // Actual usable hosts
        const explanationInfo = {
            generatorName: 'generateBitsForHostsExplanationHTML',
            args: [requiredHosts, hostBits, resultingHosts]
        };
        return { question, options: optionsArray, correctAnswer: correctAnswer.toString(), explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateBitsForHostsQuestion:", error);
        return null;
    }
}

function generateMaskForHostsQuestion() {
    try {
        const minHostBitsNeeded = 2;
        const maxHostBitsPossible = 16; // Practical limit
        const requiredHosts = getRandomInt(2, Math.pow(2, maxHostBitsPossible) - 2);

        // Calculate host bits needed
        const hostBits = Math.ceil(Math.log2(requiredHosts + 2));
        // Calculate prefix length
        const prefixLength = 32 - hostBits;
        // Ensure prefix is valid (e.g., not /31 or /32 for this question type)
        if (prefixLength < 1 || prefixLength > 30) {
            return generateMaskForHostsQuestion(); // Retry if invalid prefix generated
        }

        // Calculate the correct subnet mask string
        const correctAnswer = prefixToMaskString(prefixLength);
        if (!correctAnswer) throw new Error("Could not calculate correct mask string.");

        // Generate options
        let options = new Set([correctAnswer]);
        // Add masks from adjacent prefixes
        if (prefixLength < 30) {
            const maskPlus1 = prefixToMaskString(prefixLength + 1);
            if (maskPlus1 && maskPlus1 !== correctAnswer) options.add(maskPlus1);
        }
        if (prefixLength > 1) {
            const maskMinus1 = prefixToMaskString(prefixLength - 1);
            if (maskMinus1 && maskMinus1 !== correctAnswer) options.add(maskMinus1);
        }
        // Add a default mask as a distractor
        const defaultMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const randomDefault = defaultMasks[getRandomInt(0, defaultMasks.length - 1)];
        if (randomDefault !== correctAnswer) options.add(randomDefault);

        // Fill remaining options with random valid masks
        let fillAttempts = 0;
        while(options.size < 4 && fillAttempts < 50) {
            const randomMask = generateRandomSubnetMask(); // Generates a valid mask string
            if (randomMask !== correctAnswer && !options.has(randomMask)) {
                options.add(randomMask);
            }
            fillAttempts++;
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { // Ensure correct is present
             optionsArray.pop(); optionsArray.push(correctAnswer);
        }
        optionsArray = optionsArray.slice(0, 4); // Limit to 4
        shuffleArray(optionsArray);

        const question = {
            key: 'question_mask_for_hosts',
            replacements: { requiredHosts: formatNumber(requiredHosts) }
        };
        const explanationInfo = {
            generatorName: 'generateMaskForHostsExplanationHTML',
            args: [requiredHosts, hostBits, prefixLength, correctAnswer]
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateMaskForHostsQuestion:", error);
        return null;
    }
}


// --- Agrupar Generadores por Nivel ---
const entryQuestionGenerators = [
    generateClassQuestion,
    generateTypeQuestion,
    generateDefaultMaskQuestion,
    generateSelectClassQuestion,
    generateSelectPrivateIpQuestion,
    generateSelectIpByDefaultMaskQuestion
];

const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    generateClassAndDefaultMaskQuestion,
    generateClassAndNetworkPortionQuestion,
    generateClassAndHostPortionQuestion,
    generateRfc1918Question,
    generateSpecialAddressQuestion, // Modified
    generateIdentifyNetworkPortionQuestion,
    generateIdentifyHostPortionQuestion, // Modified
    generateNetworkBroadcastAddressQuestion
];

const professionalQuestionGenerators = [
    generateClassTypeMaskQuestion,
    generateWildcardQuestion,
    generateSubnettingQuestion,
    generateIdentifyIpTypeQuestion,
    generateBitsForSubnetsQuestion,
    generateBitsForHostsQuestion,
    generateMaskForHostsQuestion
];

// --- Función Principal para Obtener Pregunta ---
export function getNextQuestion(level) {
     let generators = [];
     if (level === 'Entry') {
         generators = entryQuestionGenerators;
     } else if (level === 'Associate') {
         generators = associateQuestionGenerators;
     } else if (level === 'Professional') {
         // Combine Associate and Professional generators for more variety at Professional level
         generators = [...associateQuestionGenerators, ...professionalQuestionGenerators];
         // Optional: Filter out duplicates if function names are identical (unlikely here)
     } else {
         console.error("Nivel desconocido solicitado:", level);
         return null;
     }

     if (!generators || generators.length === 0) {
         console.error(`No hay generadores de preguntas definidos o disponibles para el nivel: ${level}`);
         return null;
     }

     // Select a random generator function from the chosen level's pool
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             // Execute the generator function
             const questionData = generatorFunction();
             // Basic validation of the returned data structure
             if (questionData &&
                 questionData.question && questionData.question.key &&
                 Array.isArray(questionData.options) && questionData.options.length > 0 &&
                 questionData.correctAnswer !== undefined &&
                 questionData.explanation !== undefined)
             {
                 return questionData;
             } else {
                 console.error(`El generador ${generatorFunction.name || 'anónimo'} devolvió datos inválidos o incompletos.`, questionData);
                 // Attempt to get another question if the first fails
                 return getNextQuestion(level); // Recursive call - careful with infinite loops if all fail
             }
         } catch (error) {
             console.error(`Error al ejecutar el generador ${generatorFunction.name || 'anónimo'}:`, error);
              // Attempt to get another question if the generator throws an error
             return getNextQuestion(level); // Recursive call
         }
     } else {
         console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`);
         return null;
     }
}
