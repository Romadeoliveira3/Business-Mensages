import { Migration, ModelDefinition } from '../types';
import { parseModels } from '../utils/modelParser';

let dbMigrations: Migration[] = [
    { id: '1', revision: 'a1b2c3d4', down_revision: 'e5f6g7h8', message: 'Adiciona tabela de posts', timestamp: '2023-10-27 10:00:00' },
    { id: '2', revision: 'e5f6g7h8', down_revision: 'i9j0k1l2', message: 'Adiciona campo de email para usuário', timestamp: '2023-10-26 15:30:00' },
    { id: '3', revision: 'i9j0k1l2', down_revision: null, message: 'Cria tabela de usuários', timestamp: '2023-10-25 09:00:00' },
];

const MOCKED_FILE_SYSTEM: Record<string, string> = {
  '/app/models/business.py': `
"""SQLAlchemy models representing business messages."""
from __future__ import annotations
from typing import List
from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.db.database import Base

class BusinessMessage(Base):
    __tablename__ = "business_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_key: Mapped[str] = mapped_column(String(255), unique=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    translations: Mapped[List["MessageTranslation"]] = relationship(back_populates="message")

class Language(Base):
    __tablename__ = "languages"
    code: Mapped[str] = mapped_column(String(16), primary_key=True)
    translations: Mapped[List["MessageTranslation"]] = relationship(back_populates="language")

class MessageTranslation(Base):
    __tablename__ = "message_translations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("business_messages.id"))
    language_code: Mapped[str] = mapped_column(String(16), ForeignKey("languages.code"))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[BusinessMessage] = relationship(back_populates="translations")
    language: Mapped[Language] = relationship(back_populates="translations")
`,
  '/app/models/users.py': `
"""SQLAlchemy models for users and authentication."""
from __future__ import annotations
from typing import List
from sqlalchemy import ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.db.database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    posts: Mapped[List["Post"]] = relationship(back_populates="author")

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, index=True)
    content: Mapped[str] = mapped_column(String)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    author: Mapped[User] = relationship(back_populates="posts")
`
};

const generateRevisionId = () => Math.random().toString(16).substring(2, 10);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getMigrations = async (): Promise<{ migrations: Migration[], head: string | null, current: string | null }> => {
    await sleep(1000);
    const sorted = [...dbMigrations].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const head = sorted.length > 0 ? sorted[0].revision : null;
    const current = head;
    return { migrations: sorted, head, current };
};

export const getModels = async (directoryPath: string): Promise<ModelDefinition[]> => {
    await sleep(1200);
    const allContent = Object.keys(MOCKED_FILE_SYSTEM)
        .filter(path => path.startsWith(directoryPath))
        .map(path => MOCKED_FILE_SYSTEM[path])
        .join('\n\n');

    if (!allContent) {
        console.warn(`No models found in path: ${directoryPath}`);
        return [];
    }
    return parseModels(allContent);
};

export const createMigration = async (message: string, type: 'autogenerate' | 'empty'): Promise<Migration> => {
    await sleep(type === 'empty' ? 500 : 1000);
    const latestMigration = dbMigrations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const newMigration: Migration = {
        id: (dbMigrations.length + 1).toString(),
        revision: generateRevisionId(),
        down_revision: latestMigration ? latestMigration.revision : null,
        message,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    dbMigrations = [newMigration, ...dbMigrations];
    return newMigration;
};

export const updateMigrationMessage = async (id: string, message: string): Promise<Migration | null> => {
    await sleep(500);
    let updatedMigration: Migration | null = null;
    dbMigrations = dbMigrations.map(m => {
        if (m.id === id) {
            updatedMigration = { ...m, message };
            return updatedMigration;
        }
        return m;
    });
    if (!updatedMigration) {
        throw new Error("Migration not found");
    }
    return updatedMigration;
};

