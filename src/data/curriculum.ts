import type { LearningLesson, LearningWeek, LearningWord, WordCategory, WordProgress } from '../types'

const w = (
  english: string,
  ipa: string,
  vietnamese: string,
  phrase: string,
  sentence: string,
  phonics: string,
  action: string,
  visual: string,
  color: string,
  category: WordCategory,
  stage: 1 | 2 | 3 | 4,
  week: number,
): LearningWord => ({
  id: `${category}-${english.toLowerCase().replace(/\s+/g, '-')}`,
  english,
  ipa,
  vietnamese,
  phrase,
  sentence,
  phonics,
  action,
  visual,
  color,
  category,
  stage,
  week,
})

const phonicsWords: LearningWord[] = [
  w('cat', '/kæt/', 'con mèo', 'a small cat', 'This is my cat.', 'c · a · t → cat', 'Làm tai mèo bằng hai bàn tay.', 'cat', '#F59E0B', 'phonics', 1, 1),
  w('hat', '/hæt/', 'cái mũ', 'a red hat', 'I have a red hat.', 'h · a · t → hat', 'Chạm lên đầu như đang đội mũ.', 'hat', '#DB2777', 'phonics', 1, 1),
  w('bag', '/bæɡ/', 'cái cặp', 'a blue bag', 'This is my bag.', 'b · a · g → bag', 'Đeo chiếc cặp tưởng tượng lên vai.', 'bag', '#2563EB', 'school', 1, 1),
  w('pen', '/pen/', 'bút mực', 'a black pen', 'I have a pen.', 'p · e · n → pen', 'Làm động tác viết.', 'pen', '#2563EB', 'school', 1, 1),
  w('bed', '/bed/', 'cái giường', 'a soft bed', 'This is my bed.', 'b · e · d → bed', 'Chụm hai tay làm gối và nghiêng đầu.', 'bed', '#7C3AED', 'phonics', 1, 1),
  w('red', '/red/', 'màu đỏ', 'a red apple', 'The apple is red.', 'r · e · d → red', 'Chỉ vào một vật màu đỏ.', 'color', '#DC2626', 'colors', 1, 1),
  w('pig', '/pɪɡ/', 'con lợn', 'a pink pig', 'The pig is pink.', 'p · i · g → pig', 'Dùng ngón tay làm chiếc mũi tròn.', 'pig', '#EC4899', 'phonics', 1, 2),
  w('sit', '/sɪt/', 'ngồi', 'sit down', 'I can sit down.', 's · i · t → sit', 'Ngồi xuống rồi đứng lên.', 'sit', '#0EA5E9', 'actions', 1, 2),
  w('dog', '/dɔɡ/', 'con chó', 'a big dog', 'I like my dog.', 'd · o · g → dog', 'Giả tiếng vẫy đuôi bằng bàn tay.', 'dog', '#B45309', 'phonics', 1, 2),
  w('log', '/lɔɡ/', 'khúc gỗ', 'a brown log', 'The frog is on a log.', 'l · o · g → log', 'Hai tay tạo thành một khúc gỗ dài.', 'log', '#92400E', 'phonics', 1, 2),
  w('sun', '/sʌn/', 'mặt trời', 'the yellow sun', 'The sun is hot.', 's · u · n → sun', 'Dang hai tay như tia nắng.', 'sun', '#F59E0B', 'phonics', 1, 2),
  w('cup', '/kʌp/', 'cái cốc', 'a small cup', 'This is my cup.', 'c · u · p → cup', 'Hai tay ôm thành hình chiếc cốc.', 'cup', '#14B8A6', 'phonics', 1, 2),
]

const colorData = [
  ['blue', '/bluː/', 'xanh dương', 'a blue bag', 'My bag is blue.', '#2563EB'],
  ['yellow', '/ˈjeloʊ/', 'màu vàng', 'a yellow sun', 'The sun is yellow.', '#FACC15'],
  ['green', '/ɡriːn/', 'xanh lá', 'a green frog', 'The frog is green.', '#16A34A'],
  ['pink', '/pɪŋk/', 'màu hồng', 'a pink flower', 'The flower is pink.', '#EC4899'],
  ['orange', '/ˈɔːrɪndʒ/', 'màu cam', 'an orange fish', 'The fish is orange.', '#F97316'],
  ['purple', '/ˈpɜːrpəl/', 'màu tím', 'a purple kite', 'The kite is purple.', '#7C3AED'],
  ['black', '/blæk/', 'màu đen', 'a black pen', 'The pen is black.', '#111827'],
  ['white', '/waɪt/', 'màu trắng', 'a white duck', 'The duck is white.', '#CBD5E1'],
] as const

const colorWords = colorData.map(([english, ipa, vietnamese, phrase, sentence, color]) =>
  w(english, ipa, vietnamese, phrase, sentence, `${english[0]}… → ${english}`, `Tìm và chỉ một vật ${vietnamese}.`, 'color', color, 'colors', 1, 2),
)

const numberData = [
  ['one', '/wʌn/', 'một', 1], ['two', '/tuː/', 'hai', 2], ['three', '/θriː/', 'ba', 3],
  ['four', '/fɔːr/', 'bốn', 4], ['five', '/faɪv/', 'năm', 5], ['six', '/sɪks/', 'sáu', 6],
  ['seven', '/ˈsevən/', 'bảy', 7], ['eight', '/eɪt/', 'tám', 8], ['nine', '/naɪn/', 'chín', 9],
  ['ten', '/ten/', 'mười', 10], ['eleven', '/ɪˈlevən/', 'mười một', 11], ['twelve', '/twelv/', 'mười hai', 12],
  ['thirteen', '/ˌθɜːrˈtiːn/', 'mười ba', 13], ['fourteen', '/ˌfɔːrˈtiːn/', 'mười bốn', 14],
  ['fifteen', '/ˌfɪfˈtiːn/', 'mười lăm', 15], ['sixteen', '/ˌsɪksˈtiːn/', 'mười sáu', 16],
  ['seventeen', '/ˌsevənˈtiːn/', 'mười bảy', 17], ['eighteen', '/ˌeɪˈtiːn/', 'mười tám', 18],
  ['nineteen', '/ˌnaɪnˈtiːn/', 'mười chín', 19], ['twenty', '/ˈtwenti/', 'hai mươi', 20],
] as const

const numberWords = numberData.map(([english, ipa, vietnamese, number]) =>
  w(
    english,
    ipa,
    vietnamese,
    `${english} stars`,
    `I can count to ${english}.`,
    `nhìn ${number} → ${english}`,
    `Vỗ tay ${number <= 5 ? number : 3} lần rồi đọc “${english}”.`,
    `number-${number}`,
    '#2563EB',
    'numbers',
    1,
    number <= 10 ? 3 : 4,
  ),
)

const schoolWords: LearningWord[] = [
  w('book', '/bʊk/', 'quyển sách', 'a new book', 'I read a book.', 'b · oo · k → book', 'Mở hai bàn tay như quyển sách.', 'book', '#F97316', 'school', 1, 3),
  w('pencil', '/ˈpensəl/', 'bút chì', 'a yellow pencil', 'This is my pencil.', 'pen · cil', 'Làm động tác viết bằng bút chì.', 'pencil', '#F59E0B', 'school', 1, 3),
  w('eraser', '/ɪˈreɪsər/', 'cục tẩy', 'a small eraser', 'I have an eraser.', 'e · ra · ser', 'Làm động tác tẩy nhẹ.', 'eraser', '#EC4899', 'school', 1, 3),
  w('ruler', '/ˈruːlər/', 'thước kẻ', 'a long ruler', 'The ruler is long.', 'ru · ler', 'Dùng hai tay đo một đường dài.', 'ruler', '#16A34A', 'school', 1, 3),
  w('desk', '/desk/', 'bàn học', 'a clean desk', 'My book is on the desk.', 'd · e · s · k', 'Gõ nhẹ lên mặt bàn.', 'desk', '#0EA5E9', 'school', 1, 3),
]

const familyWords: LearningWord[] = [
  w('mom', '/mɑːm/', 'mẹ', 'my mom', 'This is my mom.', 'm · o · m → mom', 'Khoanh tay làm động tác ôm.', 'mom', '#DB2777', 'family', 1, 4),
  w('dad', '/dæd/', 'bố', 'my dad', 'This is my dad.', 'd · a · d → dad', 'Vẫy tay chào bố.', 'dad', '#2563EB', 'family', 1, 4),
  w('brother', '/ˈbrʌðər/', 'anh/em trai', 'my brother', 'I have a brother.', 'bro · ther', 'Chỉ sang bên cạnh như giới thiệu.', 'brother', '#0EA5E9', 'family', 1, 4),
  w('sister', '/ˈsɪstər/', 'chị/em gái', 'my sister', 'I have a sister.', 'sis · ter', 'Chỉ sang bên cạnh như giới thiệu.', 'sister', '#EC4899', 'family', 1, 4),
  w('baby', '/ˈbeɪbi/', 'em bé', 'a little baby', 'The baby is little.', 'ba · by', 'Hai tay làm động tác bế em.', 'baby', '#F59E0B', 'family', 1, 4),
  w('family', '/ˈfæməli/', 'gia đình', 'my happy family', 'I love my family.', 'fam · i · ly', 'Dang tay ôm cả gia đình.', 'family', '#7C3AED', 'family', 1, 4),
]

const sightWords: LearningWord[] = [
  w('the', '/ðə/', 'mạo từ “the”', 'the red bag', 'The bag is red.', 'sight word: nhớ cả từ', 'Đọc cả cụm “the red bag”.', 'word', '#2563EB', 'sight-words', 2, 5),
  w('is', '/ɪz/', 'là', 'it is blue', 'It is blue.', 'sight word: nhớ cả từ', 'Chỉ một vật rồi nói “It is…”.', 'word', '#16A34A', 'sight-words', 2, 5),
  w('a', '/ə/', 'một', 'a small cat', 'This is a cat.', 'sight word: âm nhẹ /ə/', 'Đưa một ngón tay lên.', 'word', '#F59E0B', 'sight-words', 2, 5),
  w('in', '/ɪn/', 'ở trong', 'in the bag', 'The pen is in the bag.', 'i · n → in', 'Đặt một tay vào lòng bàn tay kia.', 'in', '#7C3AED', 'sight-words', 2, 5),
  w('on', '/ɑːn/', 'ở trên', 'on the desk', 'The book is on the desk.', 'o · n → on', 'Đặt một tay lên trên tay kia.', 'on', '#DB2777', 'sight-words', 2, 5),
  w('this', '/ðɪs/', 'đây/cái này', 'this book', 'This is my book.', 'th · i · s → this', 'Chỉ vào vật ở gần.', 'this', '#0EA5E9', 'sight-words', 2, 5),
  w('that', '/ðæt/', 'kia/cái kia', 'that cat', 'That is a cat.', 'th · a · t → that', 'Chỉ vào vật ở xa.', 'that', '#F97316', 'sight-words', 2, 5),
  w('have', '/hæv/', 'có', 'I have a pen', 'I have a blue pen.', 'h · a · ve → have', 'Cầm một vật và nói “I have…”.', 'have', '#2563EB', 'sight-words', 2, 5),
]

const animalWords: LearningWord[] = [
  w('rabbit', '/ˈræbɪt/', 'con thỏ', 'a white rabbit', 'The rabbit can jump.', 'rab · bit', 'Nhảy nhẹ như thỏ.', 'rabbit', '#EC4899', 'animals', 2, 5),
  w('duck', '/dʌk/', 'con vịt', 'a yellow duck', 'The duck can swim.', 'd · u · ck → duck', 'Hai tay làm mỏ vịt.', 'duck', '#F59E0B', 'animals', 2, 5),
  w('bird', '/bɜːrd/', 'con chim', 'a little bird', 'The bird can fly.', 'b · ir · d → bird', 'Vỗ hai cánh tay.', 'bird', '#0EA5E9', 'animals', 2, 5),
  w('turtle', '/ˈtɜːrtəl/', 'con rùa', 'a green turtle', 'The turtle is slow.', 'tur · tle', 'Đi thật chậm như rùa.', 'turtle', '#16A34A', 'animals', 2, 5),
  w('elephant', '/ˈeləfənt/', 'con voi', 'a big elephant', 'The elephant is big.', 'el · e · phant', 'Một tay làm vòi voi.', 'elephant', '#64748B', 'animals', 2, 6),
  w('lion', '/ˈlaɪən/', 'sư tử', 'a strong lion', 'The lion is strong.', 'li · on', 'Làm bờm sư tử quanh mặt.', 'lion', '#F59E0B', 'animals', 2, 6),
  w('monkey', '/ˈmʌŋki/', 'con khỉ', 'a funny monkey', 'The monkey can climb.', 'mon · key', 'Làm động tác trèo cây.', 'monkey', '#92400E', 'animals', 2, 6),
  w('tiger', '/ˈtaɪɡər/', 'con hổ', 'an orange tiger', 'The tiger can run.', 'ti · ger', 'Đưa hai tay ra như móng vuốt.', 'tiger', '#F97316', 'animals', 2, 6),
  w('fish', '/fɪʃ/', 'con cá', 'a blue fish', 'The fish can swim.', 'f · i · sh → fish', 'Chụm tay bơi như cá.', 'fish', '#0EA5E9', 'animals', 2, 6),
  w('frog', '/frɔːɡ/', 'con ếch', 'a green frog', 'The frog is on a log.', 'fr · o · g → frog', 'Ngồi thấp và bật nhẹ.', 'frog', '#16A34A', 'animals', 2, 6),
  w('snake', '/sneɪk/', 'con rắn', 'a long snake', 'The snake is long.', 'sn · a_e → snake', 'Uốn cánh tay như rắn.', 'snake', '#65A30D', 'animals', 2, 6),
  w('bear', '/ber/', 'con gấu', 'a brown bear', 'The bear is big.', 'b · ear → bear', 'Dang tay thật rộng như gấu.', 'bear', '#92400E', 'animals', 2, 6),
]

const foodWords: LearningWord[] = [
  w('apple', '/ˈæpəl/', 'quả táo', 'a red apple', 'I like apples.', 'ap · ple', 'Giả vờ cắn một quả táo.', 'apple', '#DC2626', 'food', 2, 7),
  w('banana', '/bəˈnænə/', 'quả chuối', 'a yellow banana', 'I like bananas.', 'ba · na · na', 'Giả vờ bóc chuối.', 'banana', '#FACC15', 'food', 2, 7),
  w('bread', '/bred/', 'bánh mì', 'some fresh bread', 'I eat bread.', 'br · ea · d → bread', 'Hai tay tạo hình ổ bánh.', 'bread', '#B45309', 'food', 2, 7),
  w('rice', '/raɪs/', 'cơm/gạo', 'a bowl of rice', 'I eat rice.', 'r · i_e → rice', 'Giả vờ xúc một thìa cơm.', 'rice', '#CBD5E1', 'food', 2, 7),
  w('milk', '/mɪlk/', 'sữa', 'a glass of milk', 'I drink milk.', 'm · i · lk → milk', 'Giả vờ uống một cốc sữa.', 'milk', '#94A3B8', 'food', 2, 7),
  w('water', '/ˈwɔːtər/', 'nước', 'a glass of water', 'I drink water.', 'wa · ter', 'Giả vờ uống nước.', 'water', '#0EA5E9', 'food', 2, 7),
  w('egg', '/eɡ/', 'quả trứng', 'a small egg', 'I eat an egg.', 'e · gg → egg', 'Hai tay tạo hình quả trứng.', 'egg', '#F59E0B', 'food', 2, 7),
  w('cake', '/keɪk/', 'bánh ngọt', 'a birthday cake', 'I like cake.', 'c · a_e → cake', 'Giả vờ thổi nến.', 'cake', '#DB2777', 'food', 2, 7),
]

const bodyWords: LearningWord[] = [
  w('eyes', '/aɪz/', 'đôi mắt', 'two eyes', 'I see with my eyes.', 'eye + s → eyes', 'Chỉ vào đôi mắt.', 'eyes', '#2563EB', 'body', 2, 8),
  w('ears', '/ɪrz/', 'đôi tai', 'two ears', 'I hear with my ears.', 'ear + s → ears', 'Chỉ vào đôi tai.', 'ears', '#F59E0B', 'body', 2, 8),
  w('nose', '/noʊz/', 'mũi', 'one nose', 'This is my nose.', 'n · o_e → nose', 'Chạm nhẹ vào mũi.', 'nose', '#DB2777', 'body', 2, 8),
  w('mouth', '/maʊθ/', 'miệng', 'one mouth', 'Open your mouth.', 'm · ou · th → mouth', 'Mỉm cười và chỉ vào miệng.', 'mouth', '#DC2626', 'body', 2, 8),
  w('hands', '/hændz/', 'đôi bàn tay', 'two hands', 'Clap your hands.', 'hand + s → hands', 'Vỗ tay hai lần.', 'hands', '#F97316', 'body', 2, 8),
  w('legs', '/leɡz/', 'đôi chân', 'two legs', 'I walk with my legs.', 'leg + s → legs', 'Dậm chân nhẹ.', 'legs', '#7C3AED', 'body', 2, 8),
  w('feet', '/fiːt/', 'đôi bàn chân', 'two feet', 'Touch your feet.', 'f · ee · t → feet', 'Chạm vào bàn chân.', 'feet', '#16A34A', 'body', 2, 8),
  w('head', '/hed/', 'đầu', 'my head', 'Touch your head.', 'h · ea · d → head', 'Chạm lên đầu.', 'head', '#0EA5E9', 'body', 2, 8),
]

const actionWords: LearningWord[] = [
  w('run', '/rʌn/', 'chạy', 'run fast', 'I can run fast.', 'r · u · n → run', 'Chạy tại chỗ ba bước.', 'run', '#F97316', 'actions', 3, 9),
  w('jump', '/dʒʌmp/', 'nhảy', 'jump high', 'I can jump high.', 'j · u · mp → jump', 'Nhảy lên một lần.', 'jump', '#DB2777', 'actions', 3, 9),
  w('walk', '/wɔːk/', 'đi bộ', 'walk slowly', 'I can walk slowly.', 'w · al · k → walk', 'Đi ba bước thật chậm.', 'walk', '#2563EB', 'actions', 3, 9),
  w('swim', '/swɪm/', 'bơi', 'swim well', 'I can swim.', 'sw · i · m → swim', 'Hai tay làm động tác bơi.', 'swim', '#0EA5E9', 'actions', 3, 9),
  w('eat', '/iːt/', 'ăn', 'eat an apple', 'I eat an apple.', 'ea → /iː/', 'Giả vờ ăn một miếng.', 'eat', '#16A34A', 'actions', 3, 9),
  w('drink', '/drɪŋk/', 'uống', 'drink water', 'I drink water.', 'dr · i · nk → drink', 'Giả vờ uống nước.', 'drink', '#7C3AED', 'actions', 3, 9),
  w('sleep', '/sliːp/', 'ngủ', 'sleep well', 'I sleep in my bed.', 'sl · ee · p → sleep', 'Chụm tay làm gối.', 'sleep', '#6366F1', 'actions', 3, 9),
  w('read', '/riːd/', 'đọc', 'read a book', 'I read a book.', 'r · ea · d → read', 'Mở hai tay như quyển sách.', 'read', '#B45309', 'actions', 3, 9),
]

const feelingWords: LearningWord[] = [
  w('happy', '/ˈhæpi/', 'vui', 'very happy', 'I am happy.', 'hap · py', 'Cười thật tươi.', 'happy', '#F59E0B', 'feelings', 3, 10),
  w('sad', '/sæd/', 'buồn', 'a little sad', 'I am sad.', 's · a · d → sad', 'Làm khuôn mặt buồn.', 'sad', '#2563EB', 'feelings', 3, 10),
  w('angry', '/ˈæŋɡri/', 'tức giận', 'a little angry', 'I am angry.', 'an · gry', 'Khoanh tay và hít thở.', 'angry', '#DC2626', 'feelings', 3, 10),
  w('tired', '/ˈtaɪərd/', 'mệt', 'very tired', 'I am tired.', 'ti · red', 'Ngáp và vươn vai.', 'tired', '#7C3AED', 'feelings', 3, 10),
  w('hungry', '/ˈhʌŋɡri/', 'đói', 'very hungry', 'I am hungry.', 'hun · gry', 'Xoa bụng nhẹ.', 'hungry', '#F97316', 'feelings', 3, 10),
  w('thirsty', '/ˈθɜːrsti/', 'khát', 'very thirsty', 'I am thirsty.', 'thirs · ty', 'Giả vờ uống nước.', 'thirsty', '#0EA5E9', 'feelings', 3, 10),
]

const homeWords: LearningWord[] = [
  w('house', '/haʊs/', 'ngôi nhà', 'a small house', 'This is my house.', 'h · ou · se → house', 'Hai tay tạo thành mái nhà.', 'house', '#2563EB', 'home', 3, 11),
  w('bedroom', '/ˈbedruːm/', 'phòng ngủ', 'my bedroom', 'I sleep in my bedroom.', 'bed + room', 'Chụm tay làm gối.', 'bedroom', '#7C3AED', 'home', 3, 11),
  w('kitchen', '/ˈkɪtʃən/', 'nhà bếp', 'in the kitchen', 'We cook in the kitchen.', 'kitch · en', 'Giả vờ khuấy một nồi súp.', 'kitchen', '#F97316', 'home', 3, 11),
  w('bathroom', '/ˈbæθruːm/', 'phòng tắm', 'in the bathroom', 'I wash in the bathroom.', 'bath + room', 'Làm động tác rửa tay.', 'bathroom', '#0EA5E9', 'home', 3, 11),
  w('table', '/ˈteɪbəl/', 'cái bàn', 'a round table', 'The cup is on the table.', 'ta · ble', 'Tạo mặt bàn bằng hai tay.', 'table', '#92400E', 'home', 3, 11),
  w('chair', '/tʃer/', 'cái ghế', 'a blue chair', 'Sit on the chair.', 'ch · air → chair', 'Giả vờ ngồi xuống.', 'chair', '#2563EB', 'home', 3, 11),
  w('door', '/dɔːr/', 'cánh cửa', 'a brown door', 'Open the door.', 'd · oor → door', 'Làm động tác mở cửa.', 'door', '#B45309', 'home', 3, 11),
  w('lamp', '/læmp/', 'cái đèn', 'a bright lamp', 'The lamp is on the desk.', 'l · a · mp → lamp', 'Bật chiếc đèn tưởng tượng.', 'lamp', '#F59E0B', 'home', 3, 11),
]

export const WORDS: LearningWord[] = [
  ...phonicsWords,
  ...colorWords,
  ...numberWords,
  ...schoolWords,
  ...familyWords,
  ...sightWords,
  ...animalWords,
  ...foodWords,
  ...bodyWords,
  ...actionWords,
  ...feelingWords,
  ...homeWords,
]

export const WEEKS: LearningWeek[] = [
  { week: 1, stage: 1, title: 'Âm a, e thật vui', subtitle: 'CVC + đồ dùng gần gũi', goal: 'Nghe và ghép được các từ 3 âm đơn giản.', phonics: 'short a /æ/ · short e /e/', topics: ['phonics', 'school', 'colors'], parentTip: 'Kéo dài từng âm rồi ghép nhanh: c–a–t, cat. Không yêu cầu bé thuộc nghĩa trước.' },
  { week: 2, stage: 1, title: 'Âm i, o, u', subtitle: 'CVC + sắc màu', goal: 'Phân biệt ba nguyên âm ngắn qua từ quen thuộc.', phonics: 'short i /ɪ/ · short o /ɔ/ · short u /ʌ/', topics: ['phonics', 'colors', 'actions'], parentTip: 'Cho bé làm động tác ngay sau khi nghe. Cơ thể giúp trí nhớ giữ từ lâu hơn.' },
  { week: 3, stage: 1, title: 'Lớp học của con', subtitle: 'Số 1–10 + school things', goal: 'Đếm và gọi tên đồ dùng học tập trong cụm ngắn.', phonics: 'Nhìn chữ đầu và nghe âm đầu', topics: ['numbers', 'school'], parentTip: 'Đếm đồ thật trên bàn học thay vì chỉ nhìn màn hình.' },
  { week: 4, stage: 1, title: 'Gia đình thân yêu', subtitle: 'Số 11–20 + family', goal: 'Giới thiệu người thân bằng This is my…', phonics: 'Nhịp âm tiết trong từ dài', topics: ['numbers', 'family'], parentTip: 'Dùng ảnh gia đình ở ngoài màn hình và để bé tự chỉ, nói.' },
  { week: 5, stage: 2, title: 'Từ nhỏ mà quan trọng', subtitle: 'Sight words + pets', goal: 'Nhận ra từ chức năng trong câu rất ngắn.', phonics: 'the · is · a · in · on · this · that · have', topics: ['sight-words', 'animals'], parentTip: 'Sight word nên nhận cả hình dạng từ; không ép đánh vần từ bất quy tắc.' },
  { week: 6, stage: 2, title: 'Thế giới động vật', subtitle: 'Wild animals', goal: 'Miêu tả con vật bằng màu sắc, kích thước và hành động.', phonics: 'Ghép đầu từ với vần quen thuộc', topics: ['animals'], parentTip: 'Hỏi “What can it do?” rồi cho bé làm động tác của con vật.' },
  { week: 7, stage: 2, title: 'Món con thích', subtitle: 'Food & drinks', goal: 'Dùng I like…, I eat…, I drink…', phonics: 'Âm dài a_e, i_e và ee/ea', topics: ['food'], parentTip: 'Luyện ngay trong bữa ăn với một hoặc hai từ, không biến bữa ăn thành giờ kiểm tra.' },
  { week: 8, stage: 2, title: 'Cơ thể của con', subtitle: 'Body parts', goal: 'Nghe và phản xạ với Touch your…', phonics: 'Từ số nhiều kết thúc bằng -s', topics: ['body'], parentTip: 'Chơi Simon Says. Bé chỉ làm khi câu bắt đầu bằng “Simon says”.' },
  { week: 9, stage: 3, title: 'Con làm được!', subtitle: 'Action verbs', goal: 'Nói I can… và làm đúng hành động.', phonics: 'Cụm phụ âm đầu: sw, sl, dr', topics: ['actions'], parentTip: 'Ưu tiên vận động. Mỗi từ mới phải có ít nhất một lần bé thực hiện thật.' },
  { week: 10, stage: 3, title: 'Hôm nay con thấy sao?', subtitle: 'Feelings', goal: 'Dùng I am… để diễn đạt cảm xúc.', phonics: 'Nhịp hai âm tiết', topics: ['feelings'], parentTip: 'Không sửa cảm xúc của bé; chỉ giúp bé chọn và nói đúng từ.' },
  { week: 11, stage: 3, title: 'Ngôi nhà của con', subtitle: 'Rooms & furniture', goal: 'Nói đồ vật ở đâu bằng in/on.', phonics: 'Từ ghép: bed + room, bath + room', topics: ['home'], parentTip: 'Đi một vòng trong nhà, mỗi phòng chọn tối đa hai từ để gọi tên.' },
  { week: 12, stage: 3, title: 'Thử thách tổng hợp', subtitle: 'Nghe · nói · hành động', goal: 'Kết hợp từ cũ trong câu ngắn và phản xạ tự nhiên.', phonics: 'Ôn các âm bé còn nhầm', topics: ['actions', 'feelings', 'home'], parentTip: 'Chỉ ôn các từ chưa chắc. Từ đã thành thạo dùng trong câu, không hỏi nghĩa rời.' },
  { week: 13, stage: 4, title: 'Con là người kể chuyện', subtitle: 'Mini-project 2–3 câu', goal: 'Tự tin giới thiệu một bức tranh, thú cưng hoặc gia đình.', phonics: 'Đọc trọn câu theo nhịp', topics: ['family', 'animals', 'colors'], parentTip: 'Cho bé vẽ trên giấy rồi luyện: “This is my… It is… I love…”' },
]

const lessonTemplates: Pick<LearningLesson, 'title' | 'focus' | 'description' | 'kind'>[] = [
  { title: 'Gặp từ mới A', focus: 'Nhìn · nghe · nói', description: 'Làm quen nhóm từ đầu tiên bằng hình, âm thanh và cụm ngắn.', kind: 'discover' },
  { title: 'Gặp từ mới B', focus: 'Ghép âm · vận động', description: 'Khám phá nhóm từ tiếp theo và gắn mỗi từ với một hành động.', kind: 'discover' },
  { title: 'Đưa từ vào câu', focus: 'Cụm từ · câu ngắn', description: 'Dùng từ trong mẫu câu vừa sức thay vì học nghĩa rời.', kind: 'practice' },
  { title: 'Tai tinh, tay khéo', focus: 'Nghe chọn · luyện viết', description: 'Phân biệt từ qua âm thanh, sau đó tô và gõ lại từ.', kind: 'practice' },
  { title: 'Ôn vui cuối tuần', focus: 'Ôn cách quãng', description: 'Ôn ưu tiên những từ con chưa chắc, không học dồn.', kind: 'review' },
]

function takeCycled<T>(items: T[], start: number, count: number): T[] {
  if (!items.length) return []
  return Array.from({ length: Math.min(count, Math.max(items.length, count)) }, (_, index) => items[(start + index) % items.length])
}

export const LESSONS: LearningLesson[] = WEEKS.flatMap((week) => {
  const pool = wordsForWeek(week.week)
  if (week.week === 13) {
    return lessonTemplates.map((template, index) => ({
      id: `week-13-lesson-${index + 1}`,
      week: 13,
      order: index + 1,
      title: index < 2 ? `Chọn ý tưởng ${index + 1}` : index === 2 ? 'Xếp câu kể chuyện' : index === 3 ? 'Luyện nói cùng tranh' : 'Con kể chuyện',
      focus: index === 4 ? 'Mini-project 2–3 câu' : template.focus,
      description: index === 4 ? 'Giới thiệu bức tranh bằng This is…, It is…, I love…' : template.description,
      kind: index === 4 ? 'project' : template.kind,
      wordIds: takeCycled(pool, index * 5, 6).map((word) => word.id),
      durationMinutes: 15,
    }))
  }

  return lessonTemplates.map((template, index) => ({
    id: `week-${week.week}-lesson-${index + 1}`,
    week: week.week,
    order: index + 1,
    title: template.title,
    focus: template.focus,
    description: template.description,
    kind: template.kind,
    wordIds: takeCycled(pool, index * 6, 6).map((word) => word.id),
    durationMinutes: 15,
  }))
})

export function lessonsForWeek(week: number): LearningLesson[] {
  return LESSONS.filter((lesson) => lesson.week === week)
}

export function nextLessonAfter(finishedLesson: LearningLesson, completedIds: Set<string>): LearningLesson | undefined {
  const nextInWeek = lessonsForWeek(finishedLesson.week)
    .find((lesson) => lesson.order > finishedLesson.order && !completedIds.has(lesson.id))
  if (nextInWeek) return nextInWeek

  for (let week = finishedLesson.week + 1; week <= WEEKS.length; week += 1) {
    const next = lessonsForWeek(week).find((lesson) => !completedIds.has(lesson.id))
    if (next) return next
  }
  return undefined
}

export function wordsForLesson(lesson: LearningLesson): LearningWord[] {
  return lesson.wordIds.map((id) => WORDS.find((word) => word.id === id)).filter((word): word is LearningWord => Boolean(word))
}

export function sessionWordsForLesson(
  lesson: LearningLesson,
  progress: Record<string, WordProgress>,
  count = 6,
): LearningWord[] {
  const lessonWords = lesson.kind === 'review' ? wordsForWeek(lesson.week) : wordsForLesson(lesson)
  return [...lessonWords]
    .sort((a, b) => (progress[a.id]?.mastery ?? 0) - (progress[b.id]?.mastery ?? 0))
    .slice(0, count)
}

export const CATEGORY_LABELS: Record<WordCategory, string> = {
  phonics: 'Ghép âm', colors: 'Màu sắc', numbers: 'Số đếm', family: 'Gia đình', school: 'Trường học',
  'sight-words': 'Sight words', animals: 'Động vật', food: 'Đồ ăn', body: 'Cơ thể', actions: 'Hành động',
  feelings: 'Cảm xúc', home: 'Nhà cửa',
}

export function wordsForWeek(week: number): LearningWord[] {
  if (week === 12) return WORDS.filter((word) => word.week >= 9 && word.week <= 11)
  if (week >= 13) return WORDS.filter((word) => ['family', 'animals', 'colors'].includes(word.category))
  return WORDS.filter((word) => word.week === week)
}

export function sessionWordsForWeek(
  week: number,
  progress: Record<string, WordProgress>,
  count = 6,
): LearningWord[] {
  const pool = wordsForWeek(week)
  const day = Math.floor(Date.now() / 86_400_000)
  return [...pool]
    .sort((a, b) => {
      const masteryDifference = (progress[a.id]?.mastery ?? 0) - (progress[b.id]?.mastery ?? 0)
      if (masteryDifference !== 0) return masteryDifference
      const aShift = (a.id.length + day) % 7
      const bShift = (b.id.length + day) % 7
      return aShift - bShift
    })
    .slice(0, count)
}
