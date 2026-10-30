// Quotes the campfire's receipt printer prints, one at random per click: words about life, mostly from Christian
// writers (C.S. Lewis above all) and a few verses. Add or remove freely; `from` is the book or source, if known.
export type Quote = { text: string; by: string; from?: string };

export const quotes: Quote[] = [
  { text: 'Aim at Heaven and you will get earth “thrown in”: aim at earth and you will get neither.', by: 'C.S. Lewis', from: 'Mere Christianity' },
  { text: 'I believe in Christianity as I believe that the sun has risen: not only because I see it, but because by it I see everything else.', by: 'C.S. Lewis', from: 'Is Theology Poetry?' },
  { text: 'If I find in myself a desire which no experience in this world can satisfy, the most probable explanation is that I was made for another world.', by: 'C.S. Lewis', from: 'Mere Christianity' },
  { text: 'God cannot give us a happiness and peace apart from Himself, because it is not there. There is no such thing.', by: 'C.S. Lewis', from: 'Mere Christianity' },
  { text: 'Courage is not simply one of the virtues, but the form of every virtue at the testing point.', by: 'C.S. Lewis', from: 'The Screwtape Letters' },
  { text: 'Christianity, if false, is of no importance, and if true, of infinite importance. The only thing it cannot be is moderately important.', by: 'C.S. Lewis', from: 'God in the Dock' },
  { text: 'There are better things ahead than any we leave behind.', by: 'C.S. Lewis', from: 'a letter, 1963' },
  { text: 'We are not necessarily doubting that God will do the best for us; we are wondering how painful the best will turn out to be.', by: 'C.S. Lewis', from: 'Letters' },
  { text: 'You have made us for yourself, and our heart is restless until it rests in you.', by: 'Augustine of Hippo', from: 'Confessions' },
  { text: 'What comes into our minds when we think about God is the most important thing about us.', by: 'A.W. Tozer', from: 'The Knowledge of the Holy' },
  { text: 'The Christian ideal has not been tried and found wanting. It has been found difficult; and left untried.', by: 'G.K. Chesterton', from: 'What’s Wrong with the World' },
  { text: 'He is no fool who gives what he cannot keep to gain that which he cannot lose.', by: 'Jim Elliot' },
  { text: 'There is no pit so deep that God’s love is not deeper still.', by: 'Betsie ten Boom', from: 'The Hiding Place' },
  { text: 'Never be afraid to trust an unknown future to a known God.', by: 'Corrie ten Boom' },
  { text: 'Expect great things from God; attempt great things for God.', by: 'William Carey' },
  { text: 'All we have to decide is what to do with the time that is given us.', by: 'J.R.R. Tolkien', from: 'The Fellowship of the Ring' },
  { text: 'Life can only be understood backwards; but it must be lived forwards.', by: 'Søren Kierkegaard', from: 'Journals' },
  { text: 'I have learned to kiss the wave that throws me against the Rock of Ages.', by: 'Charles Spurgeon' },
  { text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', by: 'Colossians 3:23' },
  { text: 'Commit to the Lord whatever you do, and he will establish your plans.', by: 'Proverbs 16:3' },
];
