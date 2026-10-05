const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// ─── Admin Routes ─────────────────────────────────────────
// GET /api/leads - Get all leads
router.get('/', authorize('admin'), leadController.getAll);

// POST /api/leads - Create lead
router.post('/', authorize('admin'), leadController.create);

// PATCH /api/leads/:id/assign - Assign calling agent
router.patch('/:id/assign', authorize('admin'), leadController.assignCallingAgent);

// PATCH /api/leads/:id/assign-demo - Assign demo agent / move to demo
router.patch('/:id/assign-demo', authorize('admin'), leadController.assignDemoAgent);

// POST /api/leads/bulk-assign - Bulk assign calling/demo agents to multiple leads
router.post('/bulk-assign', authorize('admin'), leadController.bulkAssign);

// POST /api/leads/bulk-delete - Bulk delete multiple leads
router.post('/bulk-delete', authorize('admin'), leadController.bulkDelete);

// PUT /api/leads/:id - Update lead details, call status, follow-up, notes
router.put('/:id', authorize('admin'), leadController.update);

// PATCH /api/leads/:id - Partial update
router.patch('/:id', authorize('admin'), leadController.update);

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authorize('admin'), leadController.remove);

// GET /api/leads/sheet-config - Get saved Google Sheet configuration
router.get('/sheet-config', authorize('admin'), leadController.getSheetConfig);

// POST /api/leads/save-sheet-url - Save Google Sheet URL without immediate sync
router.post('/save-sheet-url', authorize('admin'), leadController.saveSheetConfig);

// POST /api/leads/sync-sheet - Sync Google Sheet
router.post('/sync-sheet', authorize('admin'), leadController.syncSheet);

// GET /api/leads/stats - Dashboard stats
router.get('/stats', authorize('admin'), leadController.getStats);

// ─── Calling Agent Routes ─────────────────────────────────
// GET /api/leads/my-leads - Get my assigned leads
router.get('/my-leads', authorize('calling_agent'), leadController.getMyLeads);

// PATCH /api/leads/:id/call-status - Update call status
router.patch('/:id/call-status', authorize('calling_agent'), leadController.updateCallStatus);

// ─── Demo Agent Routes ────────────────────────────────────
// GET /api/leads/my-demos - Get my assigned demos
router.get('/my-demos', authorize('demo_agent'), leadController.getMyDemos);

// PATCH /api/leads/:id/demo-status - Update demo status
router.patch('/:id/demo-status', authorize('demo_agent'), leadController.updateDemoStatus);

module.exports = router;
