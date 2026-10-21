// Initialize Capacitor's JS runtime before the shared native bridge executes.
// The platform injects the transport; @capacitor/core supplies the public plugin API.
import {Capacitor} from '@capacitor/core';
window.Capacitor=Capacitor;
