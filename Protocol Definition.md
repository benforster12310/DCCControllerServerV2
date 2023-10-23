# Protocol Definition

## Data Packets Will Contain

- Global Emergency Stop
- Global Track Short
- The SIMPLE locomotive address 0-15
- Emergency Stop
- The Current Speed
- The Current Direction
- Which Functions Are On Starting At F0

An example with No Faults, A loco Address of 7, current speed (positive only) 22, going forwards and with functions 1,4,7 on

> 0000111010110101001001

### Indexes

- **[0]** - Global Emergency Stop. 1 if emergency stop. 0 if not
- **[1]** - Global Track Short. 1 if track shorted. 0 if not - (host to controller only)
- **[2]** - Loco Address 4th Bit (8)
- **[3]** - Loco Address 3rd Bit (4)
- **[4]** - Loco Address 2nd Bit (2)
- **[5]** - Loco Address 1st Bit (1)
- **[6]** - Emergency Stop. 1 if emergency stop. 0 if not (controller to host only)
- **[7]** - Current Speed 5th Bit (16)
- **[8]** - Current Speed 4th Bit (8)
- **[9]** - Current Speed 3th Bit (4)
- **[10]** - Current Speed 2nd Bit (2)
- **[11]** - Current Speed 1st Bit (1)
- **[12]** - Direction Forwards. 1 if going forwards. 0 if going backwards
- **[13]** - Custom Button 1. 1 if on. 0 if off
- **[14]** - Custom Button 2. 1 if on. 0 if off
- **[15]** - Custom Button 3. 1 if on. 0 if off
- **[16]** - Custom Button 4. 1 if on. 0 if off
- **[17]** - Custom Button 5. 1 if on. 0 if off
- **[18]** - Custom Button 6. 1 if on. 0 if off
- **[19]** - Custom Button 7. 1 if on. 0 if off
- **[20]** - Custom Button 8. 1 if on. 0 if off
- **[21]** - Custom Button 9. 1 if on. 0 if off
- **[22]** - Custom Button 10. 1 if on. 0 if off
- **[23]** - Custom Button 11. 1 if on. 0 if off
- **[24]** - Custom Button 12. 1 if on. 0 if off
- **[25]** - Custom Button 13. 1 if on. 0 if off
- **[26]** - Custom Button 14. 1 if on. 0 if off
- **[27]** - Custom Button 15. 1 if on. 0 if off

> more functions could be added if necessary however it is unlikely that the hardware will be there to use the extra functions nor are they needed in most cases

### Error Definitions

- **99** - Disconnetion Error
- **88** - General Error
- **77** - Not Connecting Error
- **66** - Emergency Stop
- **55** - Track Short
