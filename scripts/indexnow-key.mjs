#!/usr/bin/env node
// Genereert een IndexNow-sleutel (32 hex). Zet de uitvoer als INDEXNOW_KEY in je deploy-omgeving.
import { randomBytes } from 'node:crypto';
console.log(randomBytes(16).toString('hex'));
