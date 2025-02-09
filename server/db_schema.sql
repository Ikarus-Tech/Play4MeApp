create database play4me;
use play4me;
create table Usuario(
	id int not null auto_increment,
    username varchar(40) not null,
    email varchar(30),
    pwd varchar(60) not null,
    primary key(id)
);

Select username from Usuario;

create table Venue(
	id int not null auto_increment,
    nome varchar(50) not null,
    localizacao varchar(50),
    email varchar(40),
    pwd varchar(60) not null,
    primary key(id)
);

drop table requisicoes;
drop table musicas_requisicao;
drop table status_;

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
    FOREIGN KEY (requisicao_id) REFERENCES Requisicoes(requisicao_id) ON DELETE CASCADE
);

create table Status_(
	id int not null auto_increment,
    music_id int not null,
    status_text varchar(25) not null,
    comentario text,
    primary key(id),
    foreign key(music_id) references Musicas_Requisicao(id)
);

ALTER TABLE Usuario ADD UNIQUE (email);
ALTER TABLE Venue ADD UNIQUE (email);
alter table Usuario modify column email varchar(255);

insert into Usuario values(default, "Felizardo77", "felizardopaulo40@gmail.com", "1234");
insert into Venue values(default, "Cais66", "Complexo coconuts, Av. da Marginal, Maputo", "cais66@gmail.com", "1234");

select * from Usuario;
select * from Venue;
select * from Requisicoes;
select * from Musicas_Requisicao;
select * from status_;
SELECT * FROM Usuario;
SELECT * FROM Usuario WHERE email = 'test_email';
select * from musicas;

SELECT 
            r.requisicao_id,
            u.id AS cliente_id,
            u.username AS cliente_nome,
            u.email AS cliente_email,
            v.id AS venue_id,
            v.nome AS venue_nome,
            v.localizacao AS venue_localizacao,
            r.data_requisicao,
            mr.id AS musica_requisicao_id,
            mr.nome AS musica_nome,
            mr.imagem AS musica_imagem,
            mr.duracao AS musica_duracao,
            s.status_text AS musica_status_text,  -- Corrigido
            s.comentario AS musica_comentario    -- Corrigido
          FROM Requisicoes r
          JOIN Usuario u ON r.cliente_id = u.id
          JOIN Venue v ON r.venue_id = v.id
          LEFT JOIN Musicas_Requisicao mr ON r.requisicao_id = mr.requisicao_id
          LEFT JOIN Status_ s ON mr.id = s.music_id
          WHERE r.venue_id = 1 order by r.data_requisicao desc;
          
alter table Status_ add column data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

#Update: Rodar esse alter table abaixo
ALTER TABLE Musicas_Requisicao ADD COLUMN played BOOLEAN DEFAULT FALSE;
