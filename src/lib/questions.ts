export type Difficulty = "facil" | "medio" | "dificil" | "especialista";
export type CategoryId = "gamer" | "futebol" | "tecnologia" | "cinema" | "ciencias" | "musica" | "gerais" | "surpresa";

export interface Question {
  id: string;
  category: Exclude<CategoryId, "surpresa">;
  text: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  difficulty: Difficulty;
}

export const CATEGORIES: { id: CategoryId; name: string; icon: string; tagline: string }[] = [
  { id: "gamer", name: "Gamer", icon: "🎮", tagline: "Minecraft, GTA, Roblox, Nintendo" },
  { id: "futebol", name: "Futebol", icon: "⚽", tagline: "Clubes, seleções e Copas" },
  { id: "tecnologia", name: "Tecnologia", icon: "💻", tagline: "Dart, JS, Python e IA" },
  { id: "cinema", name: "Cinema e Séries", icon: "🎬", tagline: "Filmes e personagens" },
  { id: "ciencias", name: "Ciências", icon: "🔬", tagline: "Espaço, física e química" },
  { id: "musica", name: "Música", icon: "🎵", tagline: "Artistas e gêneros" },
  { id: "gerais", name: "Conhecimentos Gerais", icon: "🌍", tagline: "História e geografia" },
  { id: "surpresa", name: "Desafio Surpresa", icon: "🎲", tagline: "Tudo misturado" },
];

type Raw = [string, [string, string, string, string], "A" | "B" | "C" | "D", Difficulty];

const RAW: Record<Exclude<CategoryId, "surpresa">, Raw[]> = {
  gamer: [
    ["Qual material é necessário para criar um portal para o Nether no Minecraft?", ["Pedra", "Obsidiana", "Diamante", "Ferro"], "B", "facil"],
    ["Em qual cidade fictícia se passa GTA V?", ["Vice City", "Liberty City", "Los Santos", "San Fierro"], "C", "facil"],
    ["Qual é o nome da moeda virtual do Roblox?", ["Robux", "V-Bucks", "Gold", "Coins"], "A", "facil"],
    ["Qual empresa desenvolveu o Free Fire?", ["Tencent", "Garena (111dots Studio)", "Epic Games", "Supercell"], "B", "medio"],
    ["Qual é o nome do irmão de Mario?", ["Wario", "Toad", "Luigi", "Yoshi"], "C", "facil"],
    ["Em que ano o primeiro PlayStation foi lançado no Japão?", ["1990", "1994", "1998", "2000"], "B", "dificil"],
    ["Qual criatura do Minecraft explode ao chegar perto do jogador?", ["Zumbi", "Enderman", "Creeper", "Esqueleto"], "C", "facil"],
    ["Qual console da Nintendo pode ser usado tanto na TV quanto portátil?", ["Wii U", "Switch", "GameCube", "3DS"], "B", "facil"],
    ["Qual é o nome do protagonista da série The Legend of Zelda?", ["Zelda", "Ganon", "Link", "Epona"], "C", "medio"],
    ["Quem criou o Minecraft originalmente?", ["Markus 'Notch' Persson", "Hideo Kojima", "Shigeru Miyamoto", "Gabe Newell"], "A", "dificil"],
  ],
  futebol: [
    ["Quantas Copas do Mundo a seleção brasileira já venceu?", ["3", "4", "5", "6"], "C", "facil"],
    ["Qual país sediou a Copa do Mundo de 2014?", ["Alemanha", "Brasil", "África do Sul", "Rússia"], "B", "facil"],
    ["Quantos jogadores cada time tem em campo no início de uma partida?", ["9", "10", "11", "12"], "C", "facil"],
    ["Qual seleção venceu a Copa do Mundo de 2022?", ["França", "Brasil", "Croácia", "Argentina"], "D", "facil"],
    ["Qual clube é conhecido como 'Peixe'?", ["Santos", "Grêmio", "Vasco", "Bahia"], "A", "medio"],
    ["Quem é o maior artilheiro da história das Copas do Mundo?", ["Pelé", "Ronaldo", "Miroslav Klose", "Messi"], "C", "dificil"],
    ["Em que ano o Brasil conquistou sua primeira Copa do Mundo?", ["1950", "1958", "1962", "1970"], "B", "medio"],
    ["Qual clube espanhol tem o estádio Santiago Bernabéu?", ["Barcelona", "Atlético de Madrid", "Real Madrid", "Sevilla"], "C", "facil"],
    ["Qual país venceu a primeira Copa do Mundo, em 1930?", ["Uruguai", "Itália", "Argentina", "Brasil"], "A", "dificil"],
    ["Qual jogador ficou conhecido como 'Fenômeno'?", ["Romário", "Ronaldo", "Ronaldinho", "Rivaldo"], "B", "medio"],
  ],
  tecnologia: [
    ["Qual empresa criou a linguagem Dart?", ["Microsoft", "Apple", "Google", "Meta"], "C", "facil"],
    ["Qual comando cria um novo projeto Dart?", ["dart new", "dart create", "dart init", "dart start"], "B", "medio"],
    ["O que significa a sigla CPU?", ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Core Program Utility"], "A", "facil"],
    ["Qual palavra-chave declara uma constante em JavaScript?", ["var", "let", "const", "static"], "C", "facil"],
    ["Em Python, qual função exibe texto na tela?", ["echo()", "print()", "console.log()", "write()"], "B", "facil"],
    ["Qual framework multiplataforma usa Dart?", ["React Native", "Flutter", "Ionic", "Xamarin"], "B", "facil"],
    ["Quantos bits existem em um byte?", ["4", "8", "16", "32"], "B", "medio"],
    ["Em Dart, qual operador permite acesso seguro a valores que podem ser nulos?", ["!.", "?.", "::", "=>"], "B", "dificil"],
    ["Qual é a base do sistema de numeração binário?", ["2", "8", "10", "16"], "A", "facil"],
    ["Quem é considerado o autor do 'Teste de Turing' sobre inteligência de máquinas?", ["Alan Turing", "Ada Lovelace", "John von Neumann", "Charles Babbage"], "A", "medio"],
  ],
  cinema: [
    ["Qual é o nome do vilão de 'O Rei Leão' (1994)?", ["Jafar", "Scar", "Úrsula", "Hades"], "B", "facil"],
    ["Quem dirigiu o filme 'Titanic' (1997)?", ["Steven Spielberg", "James Cameron", "Christopher Nolan", "Ridley Scott"], "B", "medio"],
    ["Em 'Harry Potter', qual é a casa de Hogwarts de Harry?", ["Sonserina", "Corvinal", "Lufa-Lufa", "Grifinória"], "D", "facil"],
    ["Qual super-herói é conhecido como 'o Homem de Ferro'?", ["Bruce Wayne", "Tony Stark", "Peter Parker", "Steve Rogers"], "B", "facil"],
    ["Em qual cidade fictícia se passa 'Stranger Things'?", ["Hawkins", "Springfield", "Riverdale", "Derry"], "A", "medio"],
    ["Qual filme venceu o Oscar de Melhor Filme em 2020 (cerimônia)?", ["1917", "Coringa", "Parasita", "Era uma Vez em Hollywood"], "C", "dificil"],
    ["Qual é o nome do cowboy de 'Toy Story'?", ["Buzz", "Woody", "Rex", "Slinky"], "B", "facil"],
    ["Qual ator interpretou Jack Sparrow em 'Piratas do Caribe'?", ["Orlando Bloom", "Johnny Depp", "Brad Pitt", "Keanu Reeves"], "B", "facil"],
    ["Em 'Star Wars', quem diz 'Eu sou seu pai'?", ["Yoda", "Obi-Wan", "Darth Vader", "Han Solo"], "C", "medio"],
    ["Qual estúdio japonês produziu 'A Viagem de Chihiro'?", ["Toei", "Studio Ghibli", "Madhouse", "Pixar"], "B", "dificil"],
  ],
  ciencias: [
    ["Qual é o planeta mais próximo do Sol?", ["Vênus", "Terra", "Mercúrio", "Marte"], "C", "facil"],
    ["Qual é a fórmula química da água?", ["CO2", "H2O", "O2", "NaCl"], "B", "facil"],
    ["Qual órgão bombeia o sangue pelo corpo humano?", ["Pulmão", "Fígado", "Coração", "Rim"], "C", "facil"],
    ["Qual é a velocidade aproximada da luz no vácuo?", ["300 mil km/s", "30 mil km/s", "3 mil km/s", "3 milhões km/s"], "A", "medio"],
    ["Quantos ossos tem o corpo humano adulto?", ["186", "206", "226", "256"], "B", "medio"],
    ["Qual é o símbolo químico do ouro?", ["Ag", "Go", "Au", "Fe"], "C", "medio"],
    ["Qual é o maior planeta do Sistema Solar?", ["Saturno", "Júpiter", "Netuno", "Urano"], "B", "facil"],
    ["Quem formulou a Teoria da Relatividade?", ["Isaac Newton", "Albert Einstein", "Galileu Galilei", "Nikola Tesla"], "B", "facil"],
    ["Qual é a unidade de medida de força no Sistema Internacional?", ["Joule", "Watt", "Newton", "Pascal"], "C", "dificil"],
    ["Qual partícula subatômica tem carga negativa?", ["Próton", "Nêutron", "Elétron", "Fóton"], "C", "medio"],
  ],
  musica: [
    ["Qual cantor é conhecido como 'Rei do Pop'?", ["Elvis Presley", "Michael Jackson", "Prince", "Freddie Mercury"], "B", "facil"],
    ["Quantas notas musicais existem na escala natural (dó a si)?", ["5", "7", "8", "12"], "B", "facil"],
    ["De qual país surgiu o gênero samba?", ["Portugal", "Cuba", "Brasil", "Argentina"], "C", "facil"],
    ["Qual banda britânica gravou 'Bohemian Rhapsody'?", ["The Beatles", "Queen", "Rolling Stones", "Pink Floyd"], "B", "facil"],
    ["Quantas cordas tem um violão tradicional?", ["4", "5", "6", "7"], "C", "facil"],
    ["Quem compôs a 'Nona Sinfonia' com a 'Ode à Alegria'?", ["Mozart", "Bach", "Beethoven", "Chopin"], "C", "medio"],
    ["Qual artista brasileiro é conhecido como 'Rei'?", ["Roberto Carlos", "Caetano Veloso", "Gilberto Gil", "Tim Maia"], "A", "medio"],
    ["De qual cidade eram os Beatles?", ["Londres", "Manchester", "Liverpool", "Birmingham"], "C", "medio"],
    ["Qual gênero musical nasceu em Nova Orleans no início do século XX?", ["Rock", "Jazz", "Reggae", "Funk"], "B", "dificil"],
    ["Qual instrumento Tom Jobim tocava principalmente?", ["Bateria", "Saxofone", "Piano", "Violino"], "C", "dificil"],
  ],
  gerais: [
    ["Qual é a capital do Brasil?", ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], "C", "facil"],
    ["Em que ano o Brasil declarou independência?", ["1500", "1822", "1889", "1922"], "B", "facil"],
    ["Qual é o maior oceano do planeta?", ["Atlântico", "Índico", "Ártico", "Pacífico"], "D", "facil"],
    ["Qual é o rio mais caudaloso do mundo?", ["Nilo", "Amazonas", "Mississipi", "Yangtzé"], "B", "medio"],
    ["Quem pintou a 'Mona Lisa'?", ["Michelangelo", "Van Gogh", "Leonardo da Vinci", "Picasso"], "C", "facil"],
    ["Qual é o país mais populoso da América do Sul?", ["Argentina", "Colômbia", "Brasil", "Peru"], "C", "facil"],
    ["Em que ano terminou a Segunda Guerra Mundial?", ["1918", "1939", "1945", "1950"], "C", "medio"],
    ["Qual é a capital da Austrália?", ["Sydney", "Melbourne", "Camberra", "Perth"], "C", "dificil"],
    ["Quantos estados o Brasil possui (sem contar o Distrito Federal)?", ["24", "26", "27", "28"], "B", "medio"],
    ["Qual civilização construiu Machu Picchu?", ["Astecas", "Maias", "Incas", "Olmecas"], "C", "dificil"],
  ],
};

export const QUESTIONS: Question[] = Object.entries(RAW).flatMap(([cat, list]) =>
  list.map(([text, options, answer, difficulty], i) => ({
    id: `${cat}-${i + 1}`,
    category: cat as Question["category"],
    text, options, answer, difficulty,
  })),
);
