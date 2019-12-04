-- ONLY RUN ONCE

use khajana_khajana;

update ShabadName set VerseID=105896, Updated=NOW() WHERE ShabadID=9475;
update ShabadName set VerseID=81833, Updated=NOW() WHERE ShabadID=7784;
update ShabadName set VerseID=98002, Updated=NOW() WHERE ShabadID=9174;

update ShabadName set VerseID=VerseID+1, Updated=NOW() WHERE ShabadID IN (7425,7426,7429,7435,7438,5419);