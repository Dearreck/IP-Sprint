// js/questions_professional.js
// ==================================================
// Generadores de Preguntas - Nivel Professional
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, getIpInfo, shuffleArray,
    generateRandomSubnetMask, getMaskPrefixLength, calculateWildcardMask,
    calculateNetworkAddress, calculateBroadcastAddress, calculateUsableHosts,
    calculateNumberOfSubnets, prefixToMaskString, formatNumber,
    generateClassRangeTableHTML, generatePrivateRangeTableHTML,
    generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, getFirstUsableHost, getLastUsableHost,
    generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML
} from './utils.js'; // Import necessary utils
import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Exportados) ---

export function generateClassTypeMaskQuestion() {
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

export function generateWildcardQuestion() {
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

export function generateSubnettingQuestion() {
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

export function generateIdentifyIpTypeQuestion() {
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

export function generateBitsForSubnetsQuestion() {
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

export function generateBitsForHostsQuestion() {
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

export function generateMaskForHostsQuestion() {
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

// Array of all generator functions for this level
export const professionalQuestionGenerators = [
    generateClassTypeMaskQuestion,
    generateWildcardQuestion,
    generateSubnettingQuestion,
    generateIdentifyIpTypeQuestion,
    generateBitsForSubnetsQuestion,
    generateBitsForHostsQuestion,
    generateMaskForHostsQuestion
];
