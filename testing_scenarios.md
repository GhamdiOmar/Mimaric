# Mimaric — Testing Scenarios & Validation Plan

> [!IMPORTANT]
> **Manual Verification Required**: Automated browser testing is currently unavailable on macOS. Please follow the scenarios below manually at `http://localhost:3000`.

## 1. Brand Identity & UI/UX
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Global Branding** | Navigate to any dashboard page. | Sidebar shows Mimaric logo, primary color is #182840, accent is #107840. |
| **Typography** | Inspect text elements. | Numbers/Dates in DM Sans, Arabic headings in IBM Plex Arabic. |
| **RTL Integrity** | Toggle language to Arabic. | Layout flips correctly, icons mirror properly (where applicable). |

## 2. Organization & Team Management
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Org Profile** | Go to `/dashboard/settings`. | Commercial Registration (CR) and VAT fields are present and editable. |
| **Team Management** | Go to `/dashboard/settings/team`. | Team list displays with correct status badges (Active/Invited). |
| **Staff Invitation** | Click "Invite Member". | Invitation modal/flow appears with role selection. |

## 3. Project & Unit Inventory
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Project Creation** | Go to `/dashboard/projects/new`. | 4-step wizard functions; progress bar updates correctly. |
| **Unit Matrix** | Go to `/dashboard/units`. | Units displayed in grid; "PCB" theme decorative traces visible. |
| **Mass Selection** | Select 3 units. | Floating bulk action bar appears at the bottom with correct count. |

## 4. Rental & Leasing lifecycle
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Lease Builder** | Go to `/dashboard/rentals/new`. | Multi-step lease creation works; generates payment schedule. |
| **Rent Collection** | Go to `/dashboard/rentals/payments`. | Financial KPIs (Total Due vs Collected) reflect mock data. |
| **Tenant Portal** | Navigate to Tenant Portal. | Tenant can see their active lease and payment status. |

## 5. Security & Isolation
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Multi-tenancy**| Mock different `org_id`. | Data from Org A is never visible to Org B (Validated via RLS script). |
