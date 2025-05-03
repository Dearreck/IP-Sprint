// js/questions_associate.js
// ==================================================
// Generadores de Preguntas - Nivel Associate
// CORREGIDO: generateClassAndHostPortionQuestion para devolver objetos completos en opciones/respuesta.
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask,
    getFirstUsableHost, getLastUsableHost
} from './utils.js'; // Import only necessary utils
import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Exportados) ---

export function generateClassAndTypeQuestion() {
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
        // Return the object as the correct answer
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndTypeQuestion:", error);
        return null;
    }
}

export function generateClassAndDefaultMaskQuestion() {
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
        // Return the object as the correct answer
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndDefaultMaskQuestion:", error);
        return null;
    }
}

export function generateClassAndNetworkPortionQuestion() {
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

        // Explanation Info
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
        // Return the object as the correct answer
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassAndNetworkPortionQuestion:", error);
        return null;
    }
}

// *** CORRECTED Function ***
export function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Get valid A, B, C IP and portions using default mask
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
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
        const correctClass = info.class; // Get class for options and explanation
        const correctHostPortion = portions.hostPortion || getTranslation('option_none'); // Correct host portion string
        const networkPortion = portions.networkPortion || getTranslation('option_none'); // Network portion string

        // --- Define Correct Answer Object ---
        const correctAnswerObject = {
            classKey: `option_class_${correctClass.toLowerCase()}`,
            portionKey: 'option_host_portion',
            portionValue: correctHostPortion
        };

        // --- Generate Options (as objects) ---
        let options = [];
        options.push(correctAnswerObject); // 1. Add the correct answer object

        // Generate incorrect options by varying class or host portion
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());

        // 2. Option: Correct Class, Incorrect Host Portion (use network portion as distractor)
        if (networkPortion !== correctHostPortion && options.length < 4) {
             options.push({
                 classKey: `option_class_${correctClass.toLowerCase()}`,
                 portionKey: 'option_host_portion', // Still asking for host portion
                 portionValue: networkPortion // But providing network portion value
             });
        }

        // 3. Option: Incorrect Class, Correct Host Portion
        if (possibleClassesLower.length > 0 && options.length < 4) {
            options.push({
                classKey: `option_class_${possibleClassesLower[0]}`,
                portionKey: 'option_host_portion',
                portionValue: correctHostPortion
            });
        }

        // 4. Option: Incorrect Class, Incorrect Host Portion (use network portion)
        if (possibleClassesLower.length > 0 && networkPortion !== correctHostPortion && options.length < 4) {
             // Check if this combination already exists (unlikely but possible)
             const exists = options.some(opt => opt.classKey === `option_class_${possibleClassesLower[0]}` && opt.portionValue === networkPortion);
             if (!exists) {
                 options.push({
                     classKey: `option_class_${possibleClassesLower[0]}`,
                     portionKey: 'option_host_portion',
                     portionValue: networkPortion
                 });
             }
        }

        // --- Fallback: Ensure 4 options with random combinations if needed ---
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionValue}`)); // Check based on class and value
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`;
            // Generate a random portion string that's likely incorrect
            let randomPortion = '';
            if (randomClassKey === 'option_class_a') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClassKey === 'option_class_b') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;

            const potentialOption = {
                classKey: randomClassKey,
                portionKey: 'option_host_portion',
                portionValue: randomPortion
            };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionValue}`;

            // Add if it's different from correct/network portion and not already present
            if (randomPortion !== correctHostPortion && randomPortion !== networkPortion && !existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        // --- End Fallback ---

        options = options.slice(0, 4); // Ensure exactly 4 options
        shuffleArray(options);

        // --- Explanation Structure (using previous modifications) ---
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const firstUsable = getFirstUsableHost(networkAddr, info.defaultMask);
        const lastUsable = getLastUsableHost(broadcastAddr, info.defaultMask);

        const explanationInfo = {
            generators: [
                {
                    generatorName: 'generateClassRangeTableHTML',
                    args: [correctClass]
                },
                {
                    generatorName: 'generatePortionExplanationHTML',
                    args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, 'usable'] // Highlight usable range
                }
            ],
            separator: '<hr style="margin: 15px 0; border-color: #eee;">'
        };

        // Return the array of option OBJECTS and the correct answer OBJECT
        return { question, options: options, correctAnswer: correctAnswerObject, explanation: explanationInfo };

    } catch (error) {
        console.error("Error en generateClassAndHostPortionQuestion:", error);
        return null;
    }
}


export function generateRfc1918Question() {
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

export function generateSpecialAddressQuestion() {
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

    } catch (error) {
        console.error("Error en generateSpecialAddressQuestion:", error);
        return null; // Return null on error
    }
}


export function generateIdentifyNetworkPortionQuestion() {
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

export function generateIdentifyHostPortionQuestion() {
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


export function generateNetworkBroadcastAddressQuestion() {
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

// Array of all generator functions for this level
export const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    generateClassAndDefaultMaskQuestion,
    generateClassAndNetworkPortionQuestion,
    generateClassAndHostPortionQuestion,
    generateRfc1918Question,
    generateSpecialAddressQuestion,
    generateIdentifyNetworkPortionQuestion,
    generateIdentifyHostPortionQuestion,
    generateNetworkBroadcastAddressQuestion
];
