import { Article } from '../models/Article.js';
import { Deposit } from '../models/Deposit.js';

function norm(s) {
  return (s || '').toString().trim().toLowerCase();
}

export async function findArticleByCodeOrAlias(token) {
  const t = norm(token);
  if (!t) return null;
  return await Article.findOne({
    $or: [
      { codigo: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { nombre: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(`^${escapeRegExp(t)}$`, 'i') } } }
    ]
  }).lean();
}

export async function findDepositByCodeOrAlias(token) {
  const t = norm(token);
  if (!t) return null;
  return await Deposit.findOne({
    $or: [
      { codigo: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { nombre: new RegExp(`^${escapeRegExp(t)}$`, 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(`^${escapeRegExp(t)}$`, 'i') } } }
    ]
  }).lean();
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
  }).limit(limit).select({ codigo: 1, nombre: 1 }).lean();
}

export async function suggestDeposits(token, limit = 5) {
  const t = norm(token);
  if (!t) return [];
  return await Deposit.find({
    $or: [
      { codigo: new RegExp(escapeRegExp(t), 'i') },
      { nombre: new RegExp(escapeRegExp(t), 'i') },
      { aliases: { $elemMatch: { $regex: new RegExp(escapeRegExp(t), 'i') } } }
    ]
  }).limit(limit).select({ codigo: 1, nombre: 1 }).lean();
}

export async function addAliasToEntity({ kind, codigo, alias }) {
  const a = norm(alias);
  if (!a) return;
  if (kind === 'article') {
    await Article.updateOne({ codigo }, { $addToSet: { aliases: a } });
  } else if (kind === 'deposit') {
    await Deposit.updateOne({ codigo }, { $addToSet: { aliases: a } });
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
