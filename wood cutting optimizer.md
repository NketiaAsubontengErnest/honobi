add a new model,

# 75. WOOD CUTTING OPTIMIZER / CUTTING PLAN MODULE

Add a complete **Wood Cutting Optimizer** to the HONOBI WOOD JOINERY management system.

This module should work similarly in concept to professional cutting-optimization software such as Cutting Pro, but it must be implemented as an original feature inside this Next.js application.

The purpose is to help HONOBI WOOD JOINERY staff calculate how to cut large boards/sheets into smaller required pieces while minimizing material waste.

This must be a real working optimization system, not a static drawing.

---

# 75.1 CUTTING OPTIMIZER DASHBOARD

Create:

```text
/dashboard/cutting-plans
```

The page should contain:

* Saved cutting plans
* Create New Cutting Plan button
* Search
* Filter by project/job
* Filter by status
* Date filter
* View
* Edit
* Duplicate
* Delete/archive
* Print
* Export

Statuses:

* Draft
* Generated
* Approved
* Printed
* Completed
* Archived

---

# 75.2 CREATE CUTTING PLAN

Create:

```text
/dashboard/cutting-plans/new
```

The user should be able to create a complete cutting plan.

Divide the interface into logical sections.

## SECTION A — STOCK BOARD / SHEET SETTINGS

Allow the user to enter the board/material they are cutting.

Fields:

* Material name
* Material type
* Board width
* Board length
* Thickness
* Quantity available
* Unit
* Board price
* Supplier
* Notes

Examples:

```text
Material: MDF
Length: 2440 mm
Width: 1220 mm
Thickness: 18 mm
Quantity: 5
```

Support different materials such as:

* MDF
* Plywood
* Hardwood
* Softwood
* Melamine board
* Chipboard
* Veneer board
* Laminated board
* Custom material

Allow the user to save frequently used board sizes.

Example presets:

```text
2440 × 1220 mm
2750 × 1830 mm
2800 × 2070 mm
3050 × 1220 mm
Custom
```

Do not assume these are the only board sizes.

Allow custom dimensions.

---

# 75.3 CUTTING SETTINGS

Create a cutting-settings section.

Fields:

### Saw Kerf

Example:

```text
3 mm
```

This represents the amount of material removed by the saw blade.

### Edge Trim

Allow:

```text
Top trim
Bottom trim
Left trim
Right trim
```

or a simple uniform trim value.

### Cutting Direction

Support:

* Horizontal
* Vertical
* Automatic optimization

### Rotation

Allow:

```text
Allow rotation
Do not allow rotation
```

### Grain Direction

Allow users to specify:

* No grain restriction
* Grain must follow length
* Grain must follow width

### Cutting Strategy

Support:

* Guillotine cutting
* General 2D rectangular nesting

Where possible, use guillotine-style cuts for practical workshop cutting.

---

# 75.4 REQUIRED PIECES INPUT

Create a dynamic cutting-pieces table.

Columns:

| Field      | Description             |
| ---------- | ----------------------- |
| Piece Name | Name/reference          |
| Length     | Required length         |
| Width      | Required width          |
| Quantity   | Number required         |
| Thickness  | Optional                |
| Grain      | Grain direction         |
| Rotation   | Allow/disallow          |
| Notes      | Additional instructions |

Example:

```text
Piece Name: Wardrobe Side
Length: 2000 mm
Width: 600 mm
Quantity: 2

Piece Name: Wardrobe Shelf
Length: 580 mm
Width: 550 mm
Quantity: 6

Piece Name: Door
Length: 1900 mm
Width: 450 mm
Quantity: 4
```

Allow unlimited rows within practical application limits.

Add:

* Add Piece
* Duplicate Piece
* Remove Piece
* Clear All
* Import Pieces
* Export Pieces

---

# 75.5 IMPORT CUTTING LIST

Allow users to upload cutting lists.

Support:

* CSV
* JSON
* Excel/XLSX where practical

The imported file should be validated.

Example CSV:

```csv
name,length,width,quantity,grain,rotation
Wardrobe Side,2000,600,2,length,true
Wardrobe Shelf,580,550,6,none,true
Door,1900,450,4,length,false
```

Show an import preview before saving.

Display validation errors clearly.

Do not import invalid dimensions or negative quantities.

---

# 75.6 EXPORT CUTTING SETTINGS

Allow users to export the complete cutting plan.

Support:

### JSON

Export:

* Board dimensions
* Material
* Thickness
* Kerf
* Trim
* Rotation settings
* Grain settings
* Required pieces
* Optimization settings
* Generated layout
* Waste information

### CSV

Export the cutting list.

### PDF

Export a professional printable cutting sheet.

### JSON REIMPORT

A previously exported JSON cutting plan must be importable back into the application.

This allows users to:

* Backup plans
* Transfer plans
* Reuse settings
* Continue work later

---

# 75.7 GENERATE CUTTING PLAN

Create a prominent button:

```text
GENERATE CUTTING PLAN
```

When clicked:

1. Validate all dimensions.
2. Validate quantities.
3. Validate board dimensions.
4. Apply edge trim.
5. Apply saw kerf.
6. Apply grain restrictions.
7. Apply rotation rules.
8. Calculate the most efficient arrangement possible.
9. Determine the number of boards required.
10. Calculate waste.
11. Generate a visual cutting diagram.
12. Generate a cutting sequence.
13. Save the result.

Show a loading/progress state while optimization is running.

---

# 75.8 CUTTING OPTIMIZATION ENGINE

Implement a real 2D rectangular cutting/nesting algorithm.

The algorithm must consider:

* Board width
* Board length
* Piece dimensions
* Quantity
* Kerf
* Edge trim
* Rotation
* Grain direction
* Multiple boards
* Waste minimization

The system should try to minimize



add payroll model wich can be set for daily, weekly or monthly

some figers are over laping cards on the dashbord so fix it
and at the "/cutting-plans/new" bring the "Add Piece" to the butom so clicking wil be easy


after generating the plan dont number them and dont use red make it like pdf and it shold be black and wite lines add print button to print on A4 sheet it should open as a canvas at the side of the page and the sheat should generate Boards used as tabs

dont add Piece Name so remove it from C


we should be able to print the invoice with the nice letter head
we shuold be able to record payments
there should be a notification for out of stock and close to finish 
Status of product should be automated
when printing dont add the Cuts list note and make it lanscape
also shade the free spaces