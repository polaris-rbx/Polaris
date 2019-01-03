const quotes = ['Don\'t cry because it\'s over, smile because it happened. ― Dr. Seuss',
	'I\'m selfish, impatient and a little insecure. I make mistakes, I am out of control and at times hard to handle. But if you can\'t handle me at my worst, then you sure as hell don\'t deserve me at my best.',
	'“You only live once, but if you do it right, once is enough.”  ― Mae West',
	'“Be the change that you wish to see in the world.”  ― Mahatma Gandhi',
	'“If you want to know what a man\'s like, take a good look at how he treats his inferiors, not his equals.”  ― J.K. Rowling, Harry Potter and the Goblet of Fire',
	'“Friendship ... is born at the moment when one man says to another "What! You too? I thought that no one but myself . . .”  ― C.S. Lewis, The Four Loves',
	'“I\'ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.”  ― Maya Angelou',
	'“Always forgive your enemies; nothing annoys them so much.”  ― Oscar Wilde',
	'“Live as if you were to die tomorrow. Learn as if you were to live forever.”  ― Mahatma Gandhi',
	'“To live is the rarest thing in the world. Most people exist, that is all.”  ― Oscar Wilde',
	'“Darkness cannot drive out darkness: only light can do that. Hate cannot drive out hate: only love can do that.”  ― Martin Luther King Jr., A Testament of Hope: The Essential Writings and Speeches',
	'“Here\'s to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently. They\'re not fond of rules. And they have no respect for the status quo. You can quote them, disagree with them, glorify or vilify them. About the only thing you can\'t do is ignore them. Because they change things. They push the human race forward. And while some may see them as the crazy ones, we see genius. Because the people who are crazy enough  to think they can change the world, are the ones who do.”  ― Rob Siltanen',
	'“I believe that everything happens for a reason. People change so that you can learn to let go, things go wrong so that you appreciate them when they\'re right, you believe lies so you eventually learn to trust no one but yourself, and sometimes good things fall apart so better things can fall together.”  ― Marilyn Monroe',
	'You don\'t choose your family. They are God\'s gift to you, as you are to them. Desmond Tutu',
	'The only true wisdom is in knowing you know nothing. - Socrates',
	'Life\'s most persistent and urgent question is, \'What are you doing for others?\' - Martin Luther King, Jr.',
	'The pessimist complains about the wind; the optimist expects it to change; the realist adjusts the sails. - William Arthur Ward',
	'Education is the most powerful weapon which you can use to change the world. - Nelson Mandela',
	'Today you are you! That is truer than true! There is no one alive who is you-er than you! - Dr. Seuss',
	'Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill',
	'It always seems impossible until it\'s done. -  Nelson Mandela',
	'To deny people their human rights is to challenge their very humanity. - Nelson Mandela',
	'As long as poverty, injustice and gross inequality persist in our world, none of us can truly rest. -  Nelson Mandela ',
	'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment. - Buddha',
	'Nothing is impossible, the word itself says \'I\'m possible\'! Audrey Hepburn',
	'Try to be a rainbow in someone\'s cloud. - Maya Angelou',
	'It is the soul\'s duty to be loyal to its own desires. It must abandon itself to its master passion. - Rebecca West',
	'What we think, we become. -  Buddha',
	'“You yourself, as much as anybody in the entire universe, deserve your love and affection” – Buddha',
	'“A man cannot be comfortable without his own approval.” – Mark Twain',
	'“Love yourself first and everything else falls into line. You really have to love yourself to get anything done in this world.” – Lucille Ball'
];

const BaseCommand = require('../baseCommand');

class pingCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = 'Produces a random quote from a person of great wisdom.';
		this.group = 'Fun';
		this.guildOnly = false;
	}
	async execute (msg) {
		var roll = getRandomIntInclusive(0, quotes.length);
		var text = quotes[roll];
		msg.channel.sendInfo(msg.author, {
			title: 'Random quote',
			description: `:scroll: ${text} :scroll:`
		});
	}
}
module.exports = pingCommand;

function getRandomIntInclusive (min, max) {
	return Math.floor(Math.random() * max);
}
