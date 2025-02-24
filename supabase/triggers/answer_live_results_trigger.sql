-- Cevap eklendiğinde canlı sonuçları güncelleyen trigger
CREATE TRIGGER answer_live_results_trigger
AFTER INSERT ON answers
FOR EACH ROW
EXECUTE FUNCTION update_live_results();
