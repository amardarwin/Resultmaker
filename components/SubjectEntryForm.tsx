I need to FINALIZES "src/components/SubjectEntryForm.tsx" with EXACT Permission Logic.

**Current Status:**
The Admin, Exam Types, and Punjabi Marks (65 Rule) are important. KEEP THEM.
I need to refine the `canEdit` permission logic to allow Class Incharges more flexibility.

Please rewrite the component with this SPECIFIC LOGIC:

**1. THE "WHO CAN EDIT?" LOGIC (Simplified & Robust):**
Create a boolean `canEdit` based on these conditions combined with OR operators:

* **Condition A (Is Admin):** `currentUser.role === 'ADMIN'`
* **Condition B (Is Class Incharge of this Class):** `currentUser.role === 'CLASS_INCHARGE'` AND `currentUser.assignedClass === selectedClass`.
* **Condition C (Is Teaching This Subject):** `currentUser.teachingSubjects` includes `selectedSubject`.

**Final Rule:**
`const canEdit = Condition A || Condition B || Condition C;`

*Explanation of Result:*
* **Admin:** `Condition A` is true -> **Can Edit Everything.**
* **Incharge (Own Class):** `Condition B` is true -> **Can Edit All Subjects.**
* **Incharge (Other Class):** `Condition B` is false, but if they teach the subject, `Condition C` is true -> **Can Edit Their Subject.**
* **Subject Teacher:** Only `Condition C` can be true -> **Can Edit Only Their Subject.**

* **UI Behavior:** If `canEdit` is false, DISABLE inputs and show gray background.

**2. PUNJABI MARKS LOGIC (Retain 65 Rule):**
* **Bimonthly:** 20 (All).
* **Term / Preboard:**
    * If Subject is `pbi_a` OR `pbi_b`: **Max 65**.
    * Others: **Max 80**.
* **Final:**
    * If Subject is `pbi_a` OR `pbi_b`: **Max 75**.
    * Others: **Max 100**.

**3. ESSENTIAL FEATURES (Do Not Change):**
* **Dynamic Dropdown:** Keep showing `agri` for 6-8 and `pbi_a/b` for 9-10.
* **Download Award List:** Keep the CSV button.
* **Data Saving:** Keep LocalStorage.

**Constraint:** Use `any` type for all variables to prevent errors.
