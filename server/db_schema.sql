
use play4meikarustec_railway;


CREATE TABLE Requisicoes (
    requisicao_id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    venue_id INT NOT NULL,
    data_requisicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES Venue(id) ON DELETE CASCADE
);

CREATE TABLE Musicas_Requisicao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requisicao_id INT NOT NULL,
    nome VARCHAR(70),
    imagem TEXT,
    duracao INT, -- Duração em milissegundos
    played BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (requisicao_id) REFERENCES Requisicoes(requisicao_id) ON DELETE CASCADE
);

create table Status_(
	id int not null auto_increment,
    music_id int not null,
    status_text varchar(25) not null default 'Pending',
    comentario text,
    data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    primary key(id),
    foreign key(music_id) references Musicas_Requisicao(id)
);

# ALTER TABLE Usuario ADD UNIQUE (email);
# ALTER TABLE Venue ADD UNIQUE (email);
# alter table Usuario modify column email varchar(255);

insert into Venue values(default, "Cais66", "Complexo coconuts, Av. da Marginal, Maputo", "cais66@gmail.com", "1234");
