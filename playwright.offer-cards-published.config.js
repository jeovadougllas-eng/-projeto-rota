import {defineConfig} from 'playwright/test';
import base from './playwright.future-campaign-published.config.js';
export default defineConfig({...base,testMatch:'offer-cards.spec.js',outputDir:'test-results-offer-cards-published'});
