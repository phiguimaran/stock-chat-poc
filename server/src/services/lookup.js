import { Article } from '../models/Article.js';
import { Deposit } from '../models/Deposit.js';

const DEPOSIT_STOPWORDS = [
  'deposito',
  'depósito',
  'almacen',
  'almacén',
  'bodega',
  'silo'
];

function norm(s) {
  return (s || '').toString().trim().toLowerCase();
}

function normDeposit(s) {
  let t = norm(s);
  if (!t) return '';

  for (const w of DEPOSIT_STOPWORDS) {
    t = t.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
  }

  return t.replace(/\s+/g, ' ').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ========= ARTÍCULOS ========= */

export async function findArticleByCodeOrAlias(token) {
  const t = norm(token);
  if (!t) return null;

  return await Article.findOne({
    $or: [
      { codigo: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { nombre: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(`^${escapeRegExp(t)}$`, 'i') } } }
    ]
  });
}

export async function suggestArticles(token, limit = 5) {
  const t = norm(token);
  if (!t) return [];

  return await Article.find({
    $or: [
      { codigo: new RegExp(escapeRegExp(t), 'i') },
      { nombre: new RegExp(escapeRegExp(t), 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(escapeRegExp(t), 'i') } } }
    ]
  }).limit(limit);
}

/* ========= DEPÓSITOS ========= */

export async function findDepositByCodeOrAlias(token) {
  const t = normDeposit(token);
  if (!t) return null;

  return await Deposit.findOne({
    $or: [
      { codigo: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { nombre: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(`^${escapeRegExp(t)}$`, 'i') } } }
    ]
  });
}

export async function suggestDeposits(token, limit = 5) {
  const t = normDeposit(token);
  if (!t) return [];

  return await Deposit.find({
    $or: [
      { codigo: new RegExp(escapeRegExp(t), 'i') },
      { nombre: new RegExp(escapeRegExp(t), 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(escapeRegExp(t), 'i') } } }
    ]
  }).limit(limit);
}

/* ========= ALIASES ========= */

export async function addAliasToEntity({ kind, codigo, alias }) {
  const a = norm(alias);
  if (!a) return;

  if (kind === 'article') {
    await Article.updateOne(
      { codigo },
      { $addToSet: { aliases: a } }
    );
  } else if (kind === 'deposit') {
    await Deposit.updateOne(
      { codigo },
      { $addToSet: { aliases: a } }
    );
  }
}

