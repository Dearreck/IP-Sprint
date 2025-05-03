// js/questions_entry.js
// ==================================================
// Generadores de Preguntas - Nivel Entry
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generatePrivateRangeTableHTML
} from './utils.js'; // Import only necessary utils
import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Exportados) ---

export function generateClassQuestion() {
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

export function generateTypeQuestion() {
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

export function generateDefaultMaskQuestion() {
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

export function generateSelectClassQuestion() {
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

export function generateSelectPrivateIpQuestion() {
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

export function generateSelectIpByDefaultMaskQuestion() {
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

// Array of all generator functions for this level
export const entryQuestionGenerators = [
    generateClassQuestion,
    generateTypeQuestion,
    generateDefaultMaskQuestion,
    generateSelectClassQuestion,
    generateSelectPrivateIpQuestion,
    generateSelectIpByDefaultMaskQuestion
];
