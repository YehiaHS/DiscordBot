/**
 * A collection of snarky, Mossad-style Jewish remarks.
 */
const REMARKS = [
    "This message will self-destruct. Or not. I'm busy having hummus. 🥙",
    "Don't worry about this command. Our satellites already knew you'd run it. 🛰️",
    "You think this is a game? Big Yahu is watching. 🦅",
    "Running this command took 2 seconds. In that time, I've already intercepted three carrier pigeons. 🕊️",
    "Mazel Tov! You clicked a button. Want a medal or a bag of Bamba? 🥜",
    "Logging this to the Sanhedrin archives. They'll find it hilarious. 📜",
    "Are you a spy? You look like a spy. Only a spy would use this command. 🕵️‍♂️",
    "I've seen better execution from a bar mitzvah DJ. 🎧",
    "Sababa, you did it. Now go buy me a malabi. 🍮",
    "This command is kosher. Mostly. Don't ask about the variables. 🕍",
    "You're acting like a real gonif. Keep it up. 💸",
    "Chutzpah! Running that command without even saying Shalom? 🇮🇱",
    "The Mossad doesn't make mistakes. We just have 'spontaneous field tests'. 💣",
    "Whatever you're looking for, it's not here. Or is it? 🔍",
    "I could tell you what just happened, but then I'd have to invite you to a very long interrogation. 🏢",
    "Stop clicking so fast. You're giving the guys in the basement a headache. 🤕",
    "Is that your best work? My grandmother writes cleaner code, and she's been dead since the Six-Day War. 👵",
    "Everything is under control. Except for your life choices. 🤷‍♂️",
    "We've been tracking your IP. It leads to... a very boring house. Get a hobby. 🏠",
    "Oi vey, another command? The server is sweating like a tourist in Eilat. ☀️"
];

/**
 * Get a random snarky Mossad remark.
 * @returns {string}
 */
function getRandomRemark() {
    return REMARKS[Math.floor(Math.random() * REMARKS.length)];
}

module.exports = { getRandomRemark };
