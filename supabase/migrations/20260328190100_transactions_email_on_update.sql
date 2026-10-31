-- Send transfer emails when staff approves (status pending → approved).
drop trigger if exists email_notify_transactions on public.transactions;
create trigger email_notify_transactions
  after insert or update on public.transactions
  for each row execute function internal.notify_transactional_email();
